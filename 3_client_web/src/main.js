import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js';

// Import settings
import { SETTINGS } from './config/settings.js'; 

lucide.createIcons();

// --- UI Elements for new Login ---
const loginTitle = document.getElementById('login-title');
const btnSubmitAuth = document.getElementById('btn-submit-auth');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const inpUsername = document.getElementById('inp-username');
const inpPassword = document.getElementById('inp-password');

// --- APP STATE ---
let currentUser = "";
let dmManager = null;
let isRegistering = false;
const debugBox = document.getElementById('debug-console');
const inpMsg = document.getElementById('inp-message');

// --- DEBUG LOGGER ---
function debug(msg) {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    if(debugBox) debugBox.innerHTML += `<div>[${time}] ${msg}</div>`;
    if(debugBox) debugBox.scrollTop = debugBox.scrollHeight;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    debug("App Ready.");
    // 1. Fill the hidden IP field
    const ipInput = document.getElementById('inp-ip');
    if (ipInput && SETTINGS.DEFAULT_IP) {
        ipInput.value = SETTINGS.DEFAULT_IP;
        debug("Tunnel IP set: " + SETTINGS.DEFAULT_IP);
    }

    // 2. Attach Auth Submit Listener
    btnSubmitAuth.addEventListener('click', handleAuthSubmit);
    btnToggleMode.addEventListener('click', toggleAuthMode);
});


// --- AUTHENTICATION LOGIC ---

function toggleAuthMode() {
    isRegistering = !isRegistering;
    if (isRegistering) {
        loginTitle.innerText = "CREATE NEW ACCOUNT";
        btnSubmitAuth.innerHTML = '<i data-lucide="user-plus"></i> REGISTER';
        btnToggleMode.innerHTML = 'Already registered? **LOGIN**';
    } else {
        loginTitle.innerText = "SECURE LOGIN";
        btnSubmitAuth.innerHTML = '<i data-lucide="log-in"></i> LOGIN';
        btnToggleMode.innerHTML = 'Don\'t have an account? **REGISTER**';
    }
    lucide.createIcons();
}

function handleAuthSubmit() {
    const user = inpUsername.value.trim();
    const pass = inpPassword.value.trim();
    const ip = document.getElementById('inp-ip').value.trim();

    if (!user || !pass) {
        alert("Username and Password are required.");
        return;
    }
    if (!ip) {
        alert("Error: Tunnel IP not configured. Check settings.js.");
        return;
    }
    
    // Determine packet type
    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;
    
    debug(`Auth attempt (${authType}) to ${ip}`);
    
    // Connect and send packet
    client.connect(ip);
    
    // Wait for WebSocket open event
    setTimeout(() => {
        client.send(authPacket);
    }, 500); 
}

// --- NETWORK HANDLER ---

const handleIncoming = (raw) => {
    debug("RX: " + raw);

    if (raw.startsWith("AUTH_REQ")) return; // Server asking for auth, handled by handleAuthSubmit
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        debug(`Login Success as ${currentUser}. Switching UI.`);
        UI.toggleLogin(false);
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    
    if (raw === "AUTH_FAILED") { 
        debug("CRITICAL: Authentication Failed.");
        alert("Login failed. Check credentials or try registering."); 
        location.reload(); 
        return; 
    }

    if (!dmManager) return;
    if (raw.startsWith("USERS:")) dmManager.updateUserList(raw);
    if (raw.startsWith("DM:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }
    // HISTORY messages (DM:sender:content) are also handled by handleIncomingDM
};

const client = new SocketClient(handleIncoming, (act) => {
    UI.setStatus(act);
    if(act) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
});

// --- EMOJI & MESSAGE LOGIC (Unchanged) ---

const emojis = ["😀","😂","😍","🥺","😎","👍","👎","🔥","❤️","✅","🎉","🤔","😭","👀","🙌","✨","💩","🤡","💀","💪","🙏","👋","🌹","🍀"];
const emojiPicker = document.getElementById('emoji-picker');
const btnEmoji = document.getElementById('btn-emoji');

emojis.forEach(em => {
    const s = document.createElement('span');
    s.className = 'emoji-btn';
    s.innerText = em;
    s.onclick = () => {
        inpMsg.value += em;
        inpMsg.focus();
    };
    emojiPicker.appendChild(s);
});

btnEmoji.addEventListener('click', (e) => {
    e.stopPropagation(); 
    emojiPicker.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== btnEmoji && !btnEmoji.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

DMManager.prototype.renderMessageBubble = function(msg) {
    const div = document.createElement('div');
    div.className = `msg-wrapper ${msg.isMe ? 'right' : 'left'}`;
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    div.innerHTML = `<div class="msg ${msg.isMe ? 'msg-me' : 'msg-other'}">${msg.text}<span class="msg-time">${time}</span></div>`;
    document.getElementById('chat-area').appendChild(div);
};

document.getElementById('form-chat').addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = inpMsg.value.trim();
    if(txt && dmManager) {
        dmManager.sendDM(txt);
        inpMsg.value = "";
        if (emojiPicker) emojiPicker.classList.add('hidden');
    }
});

document.getElementById('btn-logout').addEventListener('click', () => { client.disconnect(); location.reload(); });