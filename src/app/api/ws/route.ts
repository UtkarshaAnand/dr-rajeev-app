// API route to check WebSocket server status
// This can be called to verify WebSocket server is running

import { NextResponse } from 'next/server';
import { getWebSocketServer } from '@/lib/websocket-server';
import { initializeWebSocketServer } from '@/lib/server-init';

const WS_PORT = parseInt(process.env.WS_PORT || '3001', 10);

export async function GET() {
  try {
    // Ensure WebSocket server is initialized
    const wss = initializeWebSocketServer();
    const server = getWebSocketServer();

    return NextResponse.json({
      status: 'ok',
      websocket: server ? 'running' : 'not started',
      port: WS_PORT,
      address: server?.address() || null,
      clients: server?.clients?.size || 0,
    });
  } catch (error: any) {
    console.error('[WS API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize WebSocket server',
        message: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

