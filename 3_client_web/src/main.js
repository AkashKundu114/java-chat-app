import { SETTINGS } from './config/settings.js';
import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js'; // This is needed for the app view, even if empty

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
    
    // Initialize DMManager early (required for app view, even if no user yet)
    dmManager = new DMManager(null, (packet) => client.send(packet)); 
});

// --- NETWORK HANDLERS ---
const handleIncomingMessage = (rawText) => {
    debug("RX: " + rawText);

    if (rawText === "AUTH_REQUIRED") {
        debug("Server requested Auth. Sending credentials...");
        // This is where the client sends the stored credentials from handleAuthSubmit
        return;
    }
    
    if (rawText.startsWith("AUTH_SUCCESS:")) {
        currentUser = rawText.split(":")[1];
        debug(`Login SUCCESS as ${currentUser}. Initializing App View.`);
        UI.toggleLogin(false);
        
        // Final Fix: Force chat panel visible after successful login
        DOM.mainChatPanel.classList.remove('hidden');
        DOM.chatHeaderName.innerText = currentUser; // Update header
        return;
    }

    if (rawText === "AUTH_FAILED") { 
        debug("CRITICAL: Login Failed.");
        DOM.loginTitle.innerText = "ACCESS DENIED";
        alert("Login/Registration Failed. Check credentials.");
        // Re-enable button on failure
        DOM.btnSubmitAuth.disabled = false;
        return; 
    }

    // Handle messages (DM/HISTORY) only if dmManager is initialized
    if (dmManager) {
        if (rawText.startsWith("USERS:")) dmManager.updateUserList(rawText);
        // Add other message handlers here
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

// Client initialization outside event scope
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

    // Connect and send credentials on open
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
    DOM.btnSubmitAuth.disabled = false; // Re-enable button
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
        alert("ERROR: Select a contact before sending a message.");
    }
});

// 4. Logout Button 
const logoutButton = document.getElementById('logout-icon-small');
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        client.disconnect();
        location.reload(); 
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