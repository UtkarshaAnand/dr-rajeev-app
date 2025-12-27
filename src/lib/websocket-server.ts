// WebSocket server for realtime messaging
// This server handles WebSocket connections and message broadcasting

import { WebSocketServer, WebSocket } from 'ws';
import { broadcastToChat, addConnection, removeConnection, getConnectionInfo, getChatSockets } from './socket';
import { initializeWebSocketServer } from './server-init';

interface WebSocketMessage {
  type: 'join' | 'message' | 'ping' | 'pong' | 'typing' | 'stop_typing';
  chatId?: string;
  sender?: 'patient' | 'doctor';
  content?: string;
  message?: any;
}

let wss: WebSocketServer | null = null;

// Use global to share server instance across Next.js serverless module contexts
declare global {
  var __wss__: WebSocketServer | undefined;
}

// Get server from global or module-level variable
function getServerInstance(): WebSocketServer | null {
  // In Next.js serverless, use global to share across module contexts
  if (typeof global !== 'undefined' && global.__wss__) {
    return global.__wss__;
  }
  return wss;
}

// Set server in both global and module-level
function setServerInstance(server: WebSocketServer | null): void {
  wss = server;
  if (typeof global !== 'undefined') {
    if (server) {
      global.__wss__ = server;
    } else {
      delete global.__wss__;
    }
  }
}

export function startWebSocketServer(port: number = 3001): WebSocketServer {
  const existing = getServerInstance();
  if (existing) {
    return existing; // Already started
  }

  let newServer: WebSocketServer;
  
  try {
    newServer = new WebSocketServer({ 
      port,
      perMessageDeflate: false, // Disable compression for better compatibility
    });
    
    setServerInstance(newServer);

    // Handle server-level errors
    newServer.on('error', (error: Error & { code?: string }) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[WebSocket] Port ${port} is already in use - server may be running in another context`);
        // Don't set to null - the server might exist in another module context
        // Try to keep the reference if possible
      } else {
        console.error('[WebSocket] Server error:', error);
      }
    });

    newServer.on('listening', () => {
      // Server started successfully
    });

    // Set up connection handler
    newServer.on('connection', (ws: WebSocket, req) => {
    let chatId: string | null = null;
    let userType: 'patient' | 'doctor' | null = null;
    
    // Store chat info on the WebSocket object for later access
    (ws as any).chatId = null;
    (ws as any).userType = null;

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'join':
            if (message.chatId && message.sender) {
              chatId = message.chatId;
              userType = message.sender;
              
              // Store on WebSocket object for direct access
              (ws as any).chatId = chatId;
              (ws as any).userType = userType;
              
              addConnection(chatId, ws, userType);
              
              // Send confirmation
              const joinResponse = {
                type: 'joined',
                chatId,
                sender: userType,
              };
              ws.send(JSON.stringify(joinResponse));
            } else {
              console.warn('[WebSocket Server] Invalid join message:', message);
            }
            break;

          case 'pong':
            // Heartbeat response
            break;

          case 'message':
            // Messages are handled by the API route, not here
            // This is just for client-to-server communication if needed
            break;

          case 'typing':
            if (message.chatId && message.sender) {
              // Broadcast typing indicator to other users in the chat
              broadcastToChat(message.chatId, {
                type: 'typing',
                sender: message.sender,
                chatId: message.chatId,
              }, ws);
            }
            break;

          case 'stop_typing':
            if (message.chatId && message.sender) {
              // Broadcast stop typing to other users in the chat
              broadcastToChat(message.chatId, {
                type: 'stop_typing',
                sender: message.sender,
                chatId: message.chatId,
              }, ws);
            }
            break;
        }
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      if (chatId) {
        removeConnection(chatId, ws);
      }
      clearInterval(pingInterval);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      if (chatId) {
        removeConnection(chatId, ws);
      }
      clearInterval(pingInterval);
    });

    ws.on('pong', () => {
      // Heartbeat received
    });
    });

    return newServer;

  } catch (error: any) {
    console.error(`[WebSocket] Failed to create server on port ${port}:`, error);
    
    // If port is in use, check if server exists in global (might be from another module context)
    if (error.code === 'EADDRINUSE') {
      console.warn(`[WebSocket] Port ${port} already in use - checking for existing server instance`);
      const existing = getServerInstance();
      if (existing) {
        return existing;
      }
    }
    
    setServerInstance(null);
    throw error;
  }
}

export function getWebSocketServer(): WebSocketServer | null {
  return getServerInstance();
}

export function stopWebSocketServer(): void {
  const server = getServerInstance();
  if (server) {
    server.close();
    setServerInstance(null);
  }
}

// Export broadcast function that uses the WebSocket server
export function broadcastMessage(chatId: string, message: any, excludeSocket?: WebSocket): void {
  // Ensure we have access to the WebSocket server
  // Use getWebSocketServer() which checks both global and module-level
  let server = getWebSocketServer();
  
  // If still no server, try initializing it (might already be running in another context)
  if (!server) {
    try {
      const initialized = initializeWebSocketServer();
      server = initialized || getWebSocketServer();
    } catch (err) {
      console.error(`[WebSocket Server] Failed to initialize server:`, err);
    }
  }
  
  if (!server) {
    console.error(`[WebSocket Server] ⚠ WebSocket server not available! Cannot broadcast message.`);
    console.error(`[WebSocket Server] Messages will still be saved to database, but real-time delivery failed.`);
    return;
  }
  
  const messageStr = JSON.stringify(message);
  const sentSockets = new Set<WebSocket>(); // Track sent sockets to avoid duplicates
  let totalSent = 0;
  
  // Method 1: Always try broadcastToChat first (uses the connections map)
  const connectionInfo = getConnectionInfo(chatId);
  
  // Track sockets from connections map to avoid duplicates in fallback
  const connectionMapSockets = getChatSockets(chatId);
  if (connectionInfo.total > 0) {
    connectionMapSockets.forEach(socket => {
      if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
        sentSockets.add(socket);
      }
    });
  }
  
  // Always call broadcastToChat - it has its own checks
  broadcastToChat(chatId, message, excludeSocket);
  
  // Method 2: Fallback - Always check wss.clients as well
  // This ensures we catch any clients that might not be in the connections map
  // or if the connections map is out of sync
  if (server && server.clients) {
    server.clients.forEach((client: WebSocket) => {
      const clientChatId = (client as any).chatId;
      const clientUserType = (client as any).userType;
      const isExcluded = client === excludeSocket;
      const isOpen = client.readyState === WebSocket.OPEN;
      const alreadySent = sentSockets.has(client);
      const chatIdMatches = clientChatId === chatId;
      
      // Send to client if:
      // 1. Client is in the right chat
      // 2. Client is not excluded
      // 3. Client is open
      // 4. We haven't already sent to this socket
      if (chatIdMatches && !isExcluded && isOpen && !alreadySent) {
        try {
          client.send(messageStr);
          sentSockets.add(client);
          totalSent++;
        } catch (error) {
          console.error(`[WebSocket Server] Error sending via wss.clients to ${clientUserType}:`, error);
        }
      }
    });
  }
  
  if (connectionInfo.total === 0 && totalSent === 0) {
    console.warn(`[WebSocket Server] ⚠ No clients received the message for chat ${chatId}`);
  }
}

