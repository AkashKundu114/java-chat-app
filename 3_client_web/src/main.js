import { SETTINGS } from './config/settings.js';
import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js';

// --- GLOBAL STATE ---
let currentUser = null;
let client = null;
let dmManager = null;
let isRegistering = false; // Tracks Login vs Register mode

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
    lucide.createIcons();
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
        debug(`Login SUCCESS as ${currentUser}. Initializing UI.`);
        UI.toggleLogin(false);
        
        // Initialize DM Manager and force initial user list update
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        
        // Fix: Activate the chat panel immediately after login
        DOM.mainChatPanel.classList.remove('hidden');
        DOM.chatHeaderName.innerText = currentUser; // Default to self-profile in header

        return;
    }

    if (rawText === "AUTH_FAILED") { 
        debug("CRITICAL: Login Failed (Check credentials or if user exists).");
        document.getElementById('login-title').innerText = "ACCESS DENIED";
        alert("Login/Registration Failed. Check credentials or try REGISTER.");
        location.reload(); 
        return; 
    }

    if (!dmManager) return;

    if (rawText.startsWith("USERS:")) {
        dmManager.updateUserList(rawText);
        return;
    }

    if (rawText.startsWith("DM:")) {
        const parts = rawText.split(":", 3);
        if(parts.length === 3) dmManager.handleIncomingDM(parts[1], parts[2]);
    }
    
    if (rawText.startsWith("HISTORY:")) {
        // Handled by dmManager (it re-renders the chat bubbles)
        const parts = rawText.split(":", 3);
        if(parts.length === 3) dmManager.handleIncomingDM(parts[1], parts[2]);
    }
};

const handleStatus = (isConnected) => {
    UI.setStatus(isConnected);
    if(isConnected) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
    
    if (!isConnected && currentUser) {
        // Only reload if user was previously logged in
        setTimeout(() => location.reload(), 2000);
    }
};

client = new SocketClient(handleIncomingMessage, handleStatus);


// --- UI EVENT HANDLERS ---

const handleAuthSubmit = () => {
    const user = DOM.inpUsername.value.trim();
    const pass = DOM.inpPassword.value.trim();
    const ip = DOM.inpIp.value.trim(); // Reads the hidden field value

    if (!user || !pass) { alert("Username and Password required."); return; }

    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;

    DOM.loginTitle.innerText = `CONNECTING AS ${user}...`;
    DOM.btnSubmitAuth.disabled = true;

    // Connect to the server, and on successful connection, send the auth packet
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
});

// 3. Send Message
DOM.chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = DOM.inpMessage.value.trim();
    
    if (text && dmManager && dmManager.activeChatUser) {
        // Send DM using the DM Manager logic
        dmManager.sendDM(text);
        DOM.inpMessage.value = "";
    } else if (text) {
        // Alert user to select contact if they try to send without selecting
        alert("ERROR: Select a contact before sending a message.");
    }
});

// 4. Logout Button (The Red Arrow)
const logoutButton = document.getElementById('logout-icon-small');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        client.disconnect();
        location.reload(); // Reloads the page to show the login screen
    });
}


// 5. Emoji Picker Logic
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

// 6. Attachment Button (Placeholder Functionality)
DOM.btnAttach.addEventListener('click', () => {
    debug("Attachment initiated. (Functionality is currently placeholder)");
});