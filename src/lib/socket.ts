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

// Helper function to get connection info for debugging
export function getConnectionInfo(chatId: string): any {
  const chatConnections = connections.get(chatId);
  if (!chatConnections) {
    return { chatId, connections: [], total: 0 };
  }
  return {
    chatId,
    total: chatConnections.length,
    connections: chatConnections.map(conn => ({
      type: conn.type,
      readyState: conn.socket.readyState,
      readyStateName: conn.socket.readyState === WebSocket.OPEN ? 'OPEN' : 
                       conn.socket.readyState === WebSocket.CONNECTING ? 'CONNECTING' :
                       conn.socket.readyState === WebSocket.CLOSING ? 'CLOSING' :
                       conn.socket.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN',
    })),
  };
}

// Get actual socket connections for a chat (for tracking sent sockets)
export function getChatSockets(chatId: string): WebSocket[] {
  const chatConnections = connections.get(chatId);
  if (!chatConnections) {
    return [];
  }
  return chatConnections.map(conn => conn.socket);
}

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
    return;
  }

  chatConnections.forEach((conn) => {
    const isExcluded = conn.socket === excludeSocket;
    const isOpen = conn.socket.readyState === WebSocket.OPEN;
    
    if (!isExcluded && isOpen) {
      try {
        const messageStr = JSON.stringify(message);
        conn.socket.send(messageStr);
      } catch (error) {
        console.error(`[Socket] Error sending to ${conn.type}:`, error);
      }
    }
  });
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

