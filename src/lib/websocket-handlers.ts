// WebSocket connection handlers
// Used by custom server to handle WebSocket connections

import { WebSocketServer, WebSocket } from 'ws';
import { broadcastToChat, addConnection, removeConnection } from './socket';

interface WebSocketMessage {
  type: 'join' | 'message' | 'ping' | 'pong' | 'typing' | 'stop_typing';
  chatId?: string;
  sender?: 'patient' | 'doctor';
  content?: string;
  message?: any;
}

export function setupWebSocketHandlers(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req) => {
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

  // Store server instance globally for use by API routes
  if (typeof global !== 'undefined') {
    (global as any).__wss__ = wss;
  }
}

