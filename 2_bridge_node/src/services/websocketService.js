import { WebSocketServer } from 'ws';
import * as http from 'http'; 
import { CONFIG } from '../config/appConfig.js';
import { log } from '../utils/logger.js';
import { createJavaConnection } from './tcpService.js';

export function startBridge() {
    
    const httpServer = http.createServer((req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*' 
        });
        res.end('Bridge is Online. WebSocket is ready.');
    });

    const wss = new WebSocketServer({ server: httpServer });

    httpServer.listen(CONFIG.WS_PORT, () => {
        log('BRIDGE', `HTTP/WS Bridge running on port ${CONFIG.WS_PORT}`);
    });

    wss.on('connection', (ws, req) => {
        const ip = req.socket.remoteAddress;
        log('WS', `New Web Client Connected: ${ip}`);
        
        const javaSocket = createJavaConnection(
            (msg) => {
                if (ws.readyState === 1) ws.send(msg);
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

        ws.on('error', (err) => {
            log('WS', 'Error: ' + err.message);
        });
    });
}