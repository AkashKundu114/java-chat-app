import { SETTINGS } from '../config/settings.js';

export class SocketClient {
    constructor(onMessage, onStatusChange) {
        this.socket = null;
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
    }

    connect(inputAddress) {
        let url;

        // 1. Check if it's a Secure Tunnel (Ngrok OR LocalTunnel)
        if (inputAddress.includes("ngrok") || inputAddress.includes("loca.lt")) {
            // Strip 'https://' if user pasted it
            const cleanUrl = inputAddress.replace(/^https?:\/\//, '');
            // Force Secure WebSocket (WSS)
            url = `wss://${cleanUrl}`; 
        } else {
            // 2. Local Network IP (e.g., 192.168.1.5)
            url = `ws://${inputAddress}:${SETTINGS.BRIDGE_PORT}`;
        }

        console.log("Connecting to:", url);

        this.socket = new WebSocket(url);

        this.socket.onopen = () => this.onStatusChange(true);
        this.socket.onclose = () => this.onStatusChange(false);
        this.socket.onerror = (e) => {
            console.error("Socket Error:", e);
            this.onStatusChange(false);
        };
        
        this.socket.onmessage = (event) => {
            this.onMessage(event.data);
        };
    }

    send(text) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(text);
        }
    }

    disconnect() {
        if (this.socket) this.socket.close();
    }
}