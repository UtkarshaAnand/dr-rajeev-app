// API route to check WebSocket server status
// This can be called to verify WebSocket server is running

import { NextResponse } from 'next/server';
import { getWebSocketServer } from '@/lib/websocket-server';
import { initializeWebSocketServer } from '@/lib/server-init';

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

export async function GET() {
  try {
    // Get WebSocket server (may be in noServer mode from custom server)
    const server = getWebSocketServer();

    if (!server) {
      return NextResponse.json({
      status: 'not_started',
      websocket: 'not started',
      message: 'WebSocket server not initialized',
    });
    }

    // In noServer mode, address() is not available
    let address = null;
    let port = null;
    try {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        address = addr.address;
        port = addr.port;
      } else if (typeof addr === 'string') {
        address = addr;
      }
    } catch (e) {
      // In noServer mode, address() throws an error - this is expected
      address = 'noServer mode';
      port = process.env.PORT ? parseInt(process.env.PORT, 10) : WS_PORT;
    }

    return NextResponse.json({
      status: 'ok',
      websocket: 'running',
      address,
      port,
      clients: server?.clients?.size || 0,
      mode: address === 'noServer mode' ? 'noServer (custom server)' : 'standalone',
    });
  } catch (error: any) {
    console.error('[WS API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get WebSocket server status',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

