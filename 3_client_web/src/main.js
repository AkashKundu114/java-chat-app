import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { QRManager } from './managers/qrManager.js';
import { DMManager } from './managers/dmManager.js';

lucide.createIcons();

let currentUser = "";
let dmManager = null;

const handleIncoming = (raw) => {
    if (raw.startsWith("AUTH_REQ")) return;
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        UI.toggleLogin(false);
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    if (raw === "AUTH_FAILED") { alert("Invalid Token"); location.reload(); return; }

    if (!dmManager) return;

    if (raw.startsWith("USERS:")) {
        dmManager.updateUserList(raw);
        return;
    }

    if (raw.startsWith("DM:")) {
        const parts = raw.split(":", 3);
        const sender = parts[1];
        const content = parts[2];
        dmManager.handleIncomingDM(sender, content);
    }
};

const client = new SocketClient(handleIncoming, (active) => UI.setStatus(active));

const qr = new QRManager((token) => {
    const ip = DOM.ipInput.value.trim();
    if (!ip) { alert("Enter IP"); return; }
    document.getElementById('camera-placeholder').innerText = "Connecting...";
    client.connect(ip);
    setTimeout(() => client.send("AUTH:" + token), 500);
});

DOM.connectBtn.addEventListener('click', () => {
    document.getElementById('camera-placeholder').style.display = 'none';
    qr.startScanner("qr-reader");
});

DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.messageInput.value.trim();
    if (text && dmManager) {
        dmManager.sendDM(text);
        DOM.messageInput.value = "";
    }
});