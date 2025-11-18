import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { renderMessage } from './renderers/messageRenderer.js';
import { SocketClient } from './core/socketClient.js';
import { QRManager } from './managers/qrManager.js';
import { AIManager } from './managers/aiManager.js';

lucide.createIcons();
let currentUser = "";

const ai = new AIManager();
const aiBox = document.getElementById('ai-messages');

document.getElementById('form-ai').addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = document.getElementById('inp-ai');
    if(!inp.value.trim()) return;

    const uDiv = document.createElement('div');
    uDiv.className = "text-right text-indigo-200 mb-1";
    uDiv.innerHTML = `<span class="bg-indigo-900/40 px-2 py-1 rounded text-xs inline-block">${inp.value}</span>`;
    aiBox.appendChild(uDiv);

    const query = inp.value;
    inp.value = "";
    aiBox.scrollTop = aiBox.scrollHeight;

    const res = await ai.getResponse(query);
    const bDiv = document.createElement('div');
    bDiv.className = "text-left text-white mb-1";
    bDiv.innerHTML = `<span class="bg-indigo-600/20 px-2 py-1 rounded text-xs inline-block">${res}</span>`;
    aiBox.appendChild(bDiv);
    aiBox.scrollTop = aiBox.scrollHeight;
});

const handleIncoming = (raw) => {
    if (raw.startsWith("AUTH_REQUIRED")) return; 
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        UI.toggleLogin(false);
        renderMessage(`Logged in as ${currentUser}`, "system");
        return;
    }
    
    if (raw === "AUTH_FAILED") {
        alert("Invalid Token!");
        location.reload();
        return;
    }

    if (raw.includes(']:')) {
        const [tag, content] = raw.split(']:');
        const sender = tag.replace('[', '').trim();
        if (sender !== currentUser) renderMessage(content, 'received', sender);
    } else {
        renderMessage(raw, 'received', 'Server');
    }
};

const client = new SocketClient(handleIncoming, (isActive) => {
    UI.setStatus(isActive);
    if (!isActive && currentUser) {
        renderMessage("Connection lost...", "system");
        setTimeout(() => location.reload(), 3000);
    }
});

const qr = new QRManager((token) => {
    const ip = DOM.ipInput.value.trim();
    if (!ip) { alert("Enter IP!"); return; }
    
    document.getElementById('camera-placeholder').innerText = "Verifying Token...";
    
    client.connect(ip);
    
    setTimeout(() => {
        client.send("AUTH:" + token);
    }, 500);
});

DOM.connectBtn.addEventListener('click', () => {
    document.getElementById('camera-placeholder').style.display = 'none';
    qr.startScanner("qr-reader");
});

DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = DOM.messageInput.value.trim();
    if (txt && currentUser) {
        renderMessage(txt, 'sent'); 
        client.send(txt);
        DOM.messageInput.value = "";
    }
});

DOM.logoutBtn.addEventListener('click', () => {
    client.disconnect();
    location.reload();
});