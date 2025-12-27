// WebSocket server for realtime messaging
// This server handles WebSocket connections and message broadcasting

import { WebSocketServer, WebSocket } from 'ws';
import { broadcastToChat, addConnection, removeConnection } from './socket';

interface WebSocketMessage {
  type: 'join' | 'message' | 'ping' | 'pong' | 'typing' | 'stop_typing';
  chatId?: string;
  sender?: 'patient' | 'doctor';
  content?: string;
  message?: any;
}

let wss: WebSocketServer | null = null;

export function startWebSocketServer(port: number = 3001): WebSocketServer {
  if (wss) {
    console.log(`[WebSocket] Server already running on port ${port}`);
    return wss; // Already started
  }

  try {
    console.log(`[WebSocket] Starting server on port ${port}...`);
    wss = new WebSocketServer({ 
      port,
      perMessageDeflate: false, // Disable compression for better compatibility
    });

    // Handle server-level errors
    wss.on('error', (error: Error & { code?: string }) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`[WebSocket] Port ${port} is already in use`);
        wss = null;
      } else {
        console.error('[WebSocket] Server error:', error);
      }
    });

    wss.on('listening', () => {
      console.log(`[WebSocket] Server successfully started and listening on port ${port}`);
    });

  } catch (error: any) {
    console.error(`[WebSocket] Failed to create server on port ${port}:`, error);
    wss = null;
    throw error;
  }

  wss.on('connection', (ws: WebSocket, req) => {
    let chatId: string | null = null;
    let userType: 'patient' | 'doctor' | null = null;

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
              addConnection(chatId, ws, userType);
              console.log(`[WebSocket] ${userType} joined chat ${chatId}`);
              
              // Send confirmation
              const joinResponse = {
                type: 'joined',
                chatId,
                sender: userType,
              };
              ws.send(JSON.stringify(joinResponse));
              console.log(`[WebSocket] Sent join confirmation to ${userType} for chat ${chatId}`);
            } else {
              console.warn('[WebSocket] Invalid join message:', message);
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
        console.log(`[WebSocket] ${userType} left chat ${chatId}`);
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

  wss.on('error', (error) => {
    console.error('[WebSocket] Server error:', error);
  });

  console.log(`[WebSocket] Server started on port ${port}`);
  return wss;
}

export function getWebSocketServer(): WebSocketServer | null {
  return wss;
}

export function stopWebSocketServer(): void {
  if (wss) {
    wss.close();
    wss = null;
    console.log('[WebSocket] Server stopped');
  }
}

// Export broadcast function that uses the WebSocket server
export function broadcastMessage(chatId: string, message: any, excludeSocket?: WebSocket): void {
  console.log(`[WebSocket Server] Broadcasting message to chat ${chatId}:`, message);
  broadcastToChat(chatId, message, excludeSocket);
}

