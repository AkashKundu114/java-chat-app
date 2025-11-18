import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { QRManager } from './managers/qrManager.js';
import { DMManager } from './managers/dmManager.js';

lucide.createIcons();

let currentUser = "";
let dmManager = null;

const btnUpload = document.getElementById('btn-upload-qr');
const inputFile = document.getElementById('inp-file-qr');
const placeholder = document.getElementById('camera-placeholder');

const handleIncoming = (raw) => {
    if (raw.startsWith("AUTH_REQ")) return;
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        UI.toggleLogin(false);
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    
    if (raw === "AUTH_FAILED") { 
        alert("Invalid Token"); 
        location.reload(); 
        return; 
    }

    if (!dmManager) return;

    if (raw.startsWith("USERS:")) {
        dmManager.updateUserList(raw);
        return;
    }

    if (raw.startsWith("DM:")) {
        const parts = raw.split(":", 3);
        if(parts.length === 3) dmManager.handleIncomingDM(parts[1], parts[2]);
    }
};

const client = new SocketClient(handleIncoming, (active) => UI.setStatus(active));

const qr = new QRManager((token) => {
    const ip = DOM.ipInput.value.trim();
    if (!ip) { alert("Enter Bridge IP first!"); return; }
    
    placeholder.innerText = "Authenticating...";
    
    client.connect(ip);
    setTimeout(() => client.send("AUTH:" + token), 500);
});

DOM.connectBtn.addEventListener('click', () => {
    placeholder.style.display = 'none';
    qr.startScanner("qr-reader");
});

btnUpload.addEventListener('click', () => {
    inputFile.click();
});

inputFile.addEventListener('change', (e) => {
    if (e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    placeholder.innerText = "Scanning Image...";
    qr.scanFromFile(file);
});

DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.messageInput.value.trim();
    if (text && dmManager) {
        dmManager.sendDM(text);
        DOM.messageInput.value = "";
    }
});