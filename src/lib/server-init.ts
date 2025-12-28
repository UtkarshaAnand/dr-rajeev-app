// Server initialization - starts WebSocket server when imported
// This file is imported by API routes to ensure WebSocket server is running

import { startWebSocketServer, getWebSocketServer } from './websocket-server';

// On Render, use the same port as Next.js (PORT env var)
// In development, use a separate port (3001)
// If PORT is not set (local dev), default to 3001
const WS_PORT = process.env.PORT 
  ? parseInt(process.env.PORT, 10) 
  : parseInt(process.env.WS_PORT || '3001', 10);

let initializationAttempted = false;

export function initializeWebSocketServer(): any {
  // Return existing server if already initialized
  const existing = getWebSocketServer();
  if (existing) {
    return existing;
  }

  // If we've already attempted and failed, don't retry immediately
  // (This prevents infinite retry loops)
  if (initializationAttempted) {
    return getWebSocketServer();
  }

  initializationAttempted = true;

  try {
    const wss = startWebSocketServer(WS_PORT);
    return wss;
  } catch (error: any) {
    console.error('[Server Init] Failed to initialize WebSocket server:', error);
    // Don't throw - allow polling fallback
    if (error.code === 'EADDRINUSE') {
      console.warn('[Server Init] WebSocket port already in use - server may already be running');
      // Try to get existing server (might have been started elsewhere)
      const existing = getWebSocketServer();
      if (existing) {
        return existing;
      }
    }
    // Reset flag after a delay to allow retry on next API call
    setTimeout(() => {
      initializationAttempted = false;
    }, 5000); // Allow retry after 5 seconds
    return null;
  }
}

// Don't auto-initialize - let API routes trigger it
// This ensures proper initialization timing in Next.js

