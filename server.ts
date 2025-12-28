// Custom Next.js server with WebSocket support
// This allows WebSocket and HTTP to run on the same port (required for Render)

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { setupWebSocketHandlers } from './src/lib/websocket-handlers';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create WebSocket server for /ws path only
  const wss = new WebSocketServer({ 
    noServer: true,
    perMessageDeflate: false,
  });

  // Set up WebSocket handlers once
  setupWebSocketHandlers(wss);

  // Store server instance globally for use by API routes
  if (typeof global !== 'undefined') {
    (global as any).__wss__ = wss;
  }

  // Handle WebSocket upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url!, true);
    
    // Only handle /ws path - let Next.js handle HMR and other WebSocket connections
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // For other paths (like /_next/webpack-hmr), destroy the socket
      // Next.js HMR doesn't work with custom servers, so we just ignore it
      // The app will still work, just without hot module replacement
      socket.destroy();
    }
  });

  // Start server
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/ws`);
    if (dev) {
      console.log(`> Note: HMR (Hot Module Replacement) is disabled with custom server`);
      console.log(`> The app will refresh on file changes, but not hot-reload`);
    }
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

