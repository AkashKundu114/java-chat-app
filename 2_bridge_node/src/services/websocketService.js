import { WebSocketServer } from 'ws';
import * as http from 'http'; // Import Node's HTTP module
import { CONFIG } from '../config/appConfig.js';
import { log } from '../utils/logger.js';
import { createJavaConnection } from './tcpService.js';

export function startBridge() {
    
    // 1. Create a basic HTTP server instance
    const httpServer = http.createServer((req, res) => {
        // Send a generic 404 response for direct browser visits (e.g., if someone hits the tunnel URL directly)
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Bridge is running. Use the application interface to connect.');
    });

    // 2. Attach the WebSocket server to the HTTP server
    const wss = new WebSocketServer({ server: httpServer });

    // Start listening on the configured port
    httpServer.listen(CONFIG.WS_PORT, () => {
        log('BRIDGE', `HTTP/WS Bridge running on port ${CONFIG.WS_PORT}`);
    });

    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        log('WS', `New Web Client: ${ip}`);
        
        // 1. Create dedicated TCP pipe for this user
        const javaSocket = createJavaConnection(
            (msg) => {
                // Forward Java -> Web
                if (ws.readyState === 1) ws.send(msg.trim());
            },
            () => {
                // If Java dies, close Web
                ws.close();
            }
        );

        // 2. Forward Web -> Java
        ws.on('message', (msg) => {
            // Java needs \n to readLine()
            javaSocket.write(msg.toString() + "\n");
        });

        ws.on('close', () => {
            log('WS', 'Client disconnected');
            javaSocket.end();
        });
    });
}