// WebSocket utilities for realtime messaging
// In-memory store for WebSocket connections
// For production at scale, consider Redis or a proper WebSocket service

import { WebSocket } from 'ws';

interface SocketConnection {
  chatId: string;
  socket: WebSocket;
  type: 'patient' | 'doctor';
}

// In-memory store for WebSocket connections
const connections = new Map<string, SocketConnection[]>();

export function addConnection(
  chatId: string,
  socket: WebSocket,
  type: 'patient' | 'doctor'
): void {
  if (!connections.has(chatId)) {
    connections.set(chatId, []);
  }
  connections.get(chatId)!.push({ chatId, socket, type });
}

export function removeConnection(chatId: string, socket: WebSocket): void {
  const chatConnections = connections.get(chatId);
  if (!chatConnections) return;

  const index = chatConnections.findIndex((conn) => conn.socket === socket);
  if (index > -1) {
    chatConnections.splice(index, 1);
  }

  if (chatConnections.length === 0) {
    connections.delete(chatId);
  }
}

export function broadcastToChat(
  chatId: string,
  message: any,
  excludeSocket?: WebSocket
): void {
  const chatConnections = connections.get(chatId);
  if (!chatConnections || chatConnections.length === 0) {
    console.log(`[Socket] No connections found for chat ${chatId} to broadcast to`);
    return;
  }

  console.log(`[Socket] Broadcasting to ${chatConnections.length} connection(s) in chat ${chatId}`);
  
  let sentCount = 0;
  chatConnections.forEach((conn) => {
    if (conn.socket !== excludeSocket && conn.socket.readyState === WebSocket.OPEN) {
      try {
        conn.socket.send(JSON.stringify(message));
        sentCount++;
        console.log(`[Socket] Message sent to ${conn.type} in chat ${chatId}`);
      } catch (error) {
        console.error(`[Socket] Error sending message to ${conn.type} in chat ${chatId}:`, error);
      }
    } else {
      console.log(`[Socket] Skipping ${conn.type} in chat ${chatId} - socket state: ${conn.socket.readyState}, excluded: ${conn.socket === excludeSocket}`);
    }
  });
  
  console.log(`[Socket] Broadcast complete: ${sentCount}/${chatConnections.length} messages sent`);
}

export function broadcastToDoctors(message: any): void {
  connections.forEach((chatConnections) => {
    chatConnections.forEach((conn) => {
      if (conn.type === 'doctor' && conn.socket.readyState === WebSocket.OPEN) {
        try {
          conn.socket.send(JSON.stringify(message));
        } catch (error) {
          console.error('[Socket] Error broadcasting to doctor:', error);
        }
      }
    });
  });
}

