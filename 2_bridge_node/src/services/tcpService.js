import net from 'net';
import { CONFIG } from '../config/appConfig.js';
import { log } from '../utils/logger.js';

export function createJavaConnection(onMessage, onDisconnect) {
    const client = new net.Socket();

    client.connect(CONFIG.JAVA_PORT, CONFIG.JAVA_HOST, () => {
        log('TCP', 'Linked to Java Backend');
    });

    client.on('data', (data) => {
        onMessage(data.toString());
    });

    client.on('close', () => {
        log('TCP', 'Java Connection Closed');
        onDisconnect();
    });

    client.on('error', (err) => {
        log('TCP', 'Error: ' + err.message);
        onDisconnect();
    });

    return client;
}