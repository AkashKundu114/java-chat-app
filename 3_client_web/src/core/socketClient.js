import { SETTINGS } from '../config/settings.js';

export class SocketClient {
    constructor(onMessage, onStatusChange) {
        this.socket = null;
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
    }

    connect(inputAddress) {
        let url;

        if (inputAddress.includes("ngrok")) {
            const cleanUrl = inputAddress.replace(/^https?:\/\//, '');
            url = `wss://${cleanUrl}`; 
        } else {
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