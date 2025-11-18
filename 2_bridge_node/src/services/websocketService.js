import { WebSocketServer } from 'ws';
import { CONFIG } from '../config/appConfig.js';
import { log } from '../utils/logger.js';
import { createJavaConnection } from './tcpService.js';

export function startBridge() {
    const wss = new WebSocketServer({ port: CONFIG.WS_PORT });
    log('BRIDGE', `Running on port ${CONFIG.WS_PORT}`);

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