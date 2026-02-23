/**
 * mission-control-server.js
 * 
 * A lightweight WebSocket backend for the Mission Control dashboard.
 * 
 * PREREQUISITES:
 *   npm install ws
 * 
 * USAGE:
 *   node mission-control-server.js
 * 
 * ENDPOINTS:
 *   - WS  ws://localhost:8080            (WebSocket connection for dashboard clients)
 *   - POST http://localhost:8080/telemetry (Ingest endpoint for agents)
 * 
 * TELEMETRY SCHEMA (Agent Pulse):
 *   {
 *     "agentId": "string",
 *     "timestamp": "ISO8601 string",
 *     "status": "online" | "idle" | "working" | "error" | "offline",
 *     "metrics": {
 *       "cpu": number (percentage),
 *       "memory": number (MB used),
 *       "uptime": number (seconds)
 *     },
 *     "logs": [ "string", ... ] (optional)
 *   }
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// 1. Create the HTTP server
const server = http.createServer((req, res) => {
  // CORS headers to allow local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve the HTML file
  if (req.method === 'GET' && req.url === '/') {
    const htmlPath = path.join(__dirname, 'mission-control.html');
    fs.readFile(htmlPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading mission-control.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  // Telemetry Ingest Endpoint
  if (req.method === 'POST' && req.url === '/telemetry') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const telemetryData = JSON.parse(body);
        
        // Basic validation (Agent Pulse Schema check)
        if (!telemetryData.agentId || !telemetryData.status) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid schema: agentId and status are required.' }));
          return;
        }

        // Add server-side timestamp if missing
        if (!telemetryData.timestamp) {
            telemetryData.timestamp = new Date().toISOString();
        }

        // Broadcast to all connected WebSocket clients
        broadcast(telemetryData);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', broadcast_count: wss.clients.size }));
        
        console.log(`[${new Date().toISOString()}] Telemetry received from ${telemetryData.agentId}`);

      } catch (e) {
        console.error('Error parsing telemetry:', e);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    // 404 for other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found. Use POST /telemetry to send data.');
  }
});

// 2. Create the WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to Mission Control');

  // Send initial handshake/status
  ws.send(JSON.stringify({
    type: 'SYSTEM',
    message: 'Connected to Mission Control Backend',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

/**
 * Broadcasts data to all connected WebSocket clients.
 * Wraps the telemetry in a standard envelope.
 */
function broadcast(data) {
  const message = JSON.stringify({
    type: 'TELEMETRY',
    payload: data
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// 3. Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  Mission Control Backend Running
  -------------------------------
  Dashboard: http://76.13.243.223:${PORT}
  WS:        ws://76.13.243.223:${PORT}
  POST:      http://76.13.243.223:${PORT}/telemetry
  `);
});
