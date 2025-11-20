import { SETTINGS } from './config/settings.js';
import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js';

// --- GLOBAL STATE ---
let currentUser = null;
let client = null;
let dmManager = null; // Will be initialized after successful login
let isRegistering = false; 

const EMOJIS = ['🚀', '💻', '💡', '✅', '☕', '🔥', '⚙️', '🤖', '🔒', '🎉'];

// --- DEBUG/INIT FUNCTIONS ---
const debugBox = document.getElementById('debug-console');
function debug(msg) {
    if (debugBox) {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        debugBox.innerHTML += `<div>[${time}] ${msg}</div>`;
        debugBox.scrollTop = debugBox.scrollHeight;
    }
}

// Automatically populate the hidden IP field when the page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    const ipInput = document.getElementById('inp-ip');
    
    if (ipInput) {
        ipInput.value = SETTINGS.DEFAULT_IP;
        debug("UI Initialized. Default IP Set.");
    }
});

// --- NETWORK HANDLERS ---
const handleIncomingMessage = (rawText) => {
    debug("RX: " + rawText);

    if (rawText === "AUTH_REQUIRED") {
        debug("Server requested Auth. Sending credentials...");
        return;
    }
    
    if (rawText.startsWith("AUTH_SUCCESS:")) {
        currentUser = rawText.split(":")[1];
        debug(`Login SUCCESS as ${currentUser}. Initializing App View.`);
        
        // CRITICAL FIX: 
        // 1. Initialize DM Manager with the confirmed username
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        
        // 2. Toggle UI and show chat panels
        UI.toggleLogin(false);
        DOM.mainChatPanel.classList.remove('hidden'); 
        
        // 3. Update initial display elements
        DOM.chatHeaderName.innerText = currentUser;
        
        return;
    }

    if (rawText === "AUTH_FAILED") { 
        debug("CRITICAL: Login Failed. Credentials rejected by DB.");
        DOM.loginTitle.innerText = "ACCESS DENIED";
        DOM.btnSubmitAuth.disabled = false;
        alert("Login/Registration Failed. Check credentials or try REGISTER.");
        return; 
    }

    if (!dmManager) return; // Should not happen after successful login

    // Handle incoming data packets
    if (rawText.startsWith("USERS:")) {
        dmManager.updateUserList(rawText);
        return;
    }

    if (rawText.startsWith("DM:") || rawText.startsWith("HISTORY:")) {
        const parts = rawText.split(":", 3);
        if(parts.length >= 3) dmManager.handleIncomingDM(parts[1], parts[2]);
    }
};

const handleStatus = (isConnected) => {
    UI.setStatus(isConnected);
    if(isConnected) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
    
    if (!isConnected && currentUser) {
        setTimeout(() => location.reload(), 2000);
    }
};

// Client initialization 
client = new SocketClient(handleIncomingMessage, handleStatus);


// --- UI EVENT HANDLERS ---

const handleAuthSubmit = () => {
    const user = DOM.inpUsername.value.trim();
    const pass = DOM.inpPassword.value.trim();
    const ip = DOM.inpIp.value.trim(); 

    if (!user || !pass) { alert("Username and Password required."); return; }
    if (!ip) { alert("Bridge IP is required."); return; }


    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;

    DOM.loginTitle.innerText = `CONNECTING AS ${user}...`;
    DOM.btnSubmitAuth.disabled = true;

    // Connect and send credentials on successful open
    client.connect(ip, () => {
        client.send(authPacket);
    });
};

// 1. Login/Register Button
DOM.btnSubmitAuth.addEventListener('click', handleAuthSubmit);

// 2. Toggle Login/Register Mode
DOM.btnToggleMode.addEventListener('click', () => {
    isRegistering = !isRegistering;
    DOM.loginTitle.innerText = isRegistering ? "REGISTER NEW USER" : "SECURE LOGIN";
    DOM.btnToggleMode.innerHTML = isRegistering 
        ? `Already registered? **LOGIN**` 
        : `Don't have an account? **REGISTER**`;
    DOM.btnSubmitAuth.innerText = isRegistering ? 'REGISTER' : 'LOGIN';
    DOM.btnSubmitAuth.disabled = false; 
});

// 3. Send Message
DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.inpMessage.value.trim();
    
    if (text && dmManager && dmManager.activeChatUser) {
        dmManager.sendDM(text);
        DOM.inpMessage.value = "";
    } else if (text) {
        alert("ERROR: Select a contact before sending a message.");
    }
});

// 4. Emoji Picker Logic
const emojiPicker = document.getElementById('emoji-picker');
EMOJIS.forEach(emoji => {
    const btn = document.createElement('span');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => {
        DOM.inpMessage.value += emoji;
        emojiPicker.classList.add('hidden');
    };
    emojiPicker.appendChild(btn);
});

DOM.btnEmoji.addEventListener('click', () => {
    emojiPicker.classList.toggle('hidden');
});

// 5. Attachment Button (Placeholder Functionality)
DOM.btnAttach.addEventListener('click', () => {
    alert("Attachment initiated. (Functionality is currently placeholder)");
});