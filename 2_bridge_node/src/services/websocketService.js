import { WebSocketServer } from 'ws';
import * as http from 'http'; 
import { CONFIG } from '../config/appConfig.js';
import { log } from '../utils/logger.js';
import { createJavaConnection } from './tcpService.js';

export function startBridge() {
    
    const httpServer = http.createServer((req, res) => {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end('Bridge is running. Use the application interface to connect.');
    });

    const wss = new WebSocketServer({ server: httpServer });

    httpServer.listen(CONFIG.WS_PORT, () => {
        log('BRIDGE', `HTTP/WS Bridge running on port ${CONFIG.WS_PORT}`);
    });

    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        log('WS', `New Web Client: ${ip}`);
        
        const javaSocket = createJavaConnection(
            (msg) => {
                if (ws.readyState === 1) ws.send(msg.trim());
            },
            () => {
                ws.close();
            }
        );

        ws.on('message', (msg) => {
            javaSocket.write(msg.toString() + "\n");
        });

        ws.on('close', () => {
            log('WS', 'Client disconnected');
            javaSocket.end();
        });
    });
}