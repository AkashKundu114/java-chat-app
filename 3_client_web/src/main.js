import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js';

// Import settings (assuming this still has DEFAULT_IP for local/tunnel)
import { SETTINGS } from './config/settings.js'; 

lucide.createIcons();

// --- UI Elements ---
const loginTitle = document.getElementById('login-title');
const btnSubmitAuth = document.getElementById('btn-submit-auth');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const inpUsername = document.getElementById('inp-username');
const inpPassword = document.getElementById('inp-password');
const ipInput = document.getElementById('inp-ip'); // Hidden input

// --- APP STATE ---
let currentUser = "";
let dmManager = null;
let isRegistering = false; // False = Login mode by default

const debugBox = document.getElementById('debug-console');
const inpMsg = document.getElementById('inp-message');
const emojiPicker = document.getElementById('emoji-picker');

// --- DEBUG LOGGER ---
function debug(msg) {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    if(debugBox) debugBox.innerHTML += `<div>[${time}] ${msg}</div>`;
    if(debugBox) debugBox.scrollTop = debugBox.scrollHeight;
    console.log(msg);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    debug("App Ready.");
    
    // 1. Auto-fill the hidden IP field
    if (ipInput && SETTINGS.DEFAULT_IP) {
        ipInput.value = SETTINGS.DEFAULT_IP;
        debug("Tunnel IP set: " + SETTINGS.DEFAULT_IP);
    } else {
        debug("WARNING: Default IP not found in settings.js.");
    }

    // 2. Attach Listeners
    btnSubmitAuth.addEventListener('click', handleAuthSubmit);
    btnToggleMode.addEventListener('click', toggleAuthMode);
    
    // Set initial UI state
    toggleAuthMode(); // Call once to set buttons/title correctly
    toggleAuthMode(); // Call again to set default (LOGIN) state
});


// --- AUTHENTICATION HANDLERS ---

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
    const ip = ipInput.value.trim(); // Reads from hidden input

    if (!user || !pass) {
        alert("Username and Password are required.");
        return;
    }
    if (!ip || ip.includes("your-subdomain")) {
        alert("ERROR: Please update settings.js with your LocalTunnel/Ngrok URL.");
        return;
    }
    
    // Construct the packet expected by ClientWorker.java
    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;
    
    debug(`Auth attempt (${authType}) to ${ip}`);
    
    // Connect and send packet
    client.connect(ip);
    
    // Wait for WebSocket open event before sending the auth string
    setTimeout(() => {
        client.send(authPacket);
    }, 500); 
}

// --- NETWORK HANDLER ---

const handleIncoming = (raw) => {
    debug("RX: " + raw);

    if (raw.startsWith("AUTH_REQUIRED")) return; // Server is ready
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        debug(`Login Success as ${currentUser}. Switching UI.`);
        UI.toggleLogin(false);
        
        // Initialize DM Manager
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    
    if (raw === "AUTH_FAILED") { 
        debug("CRITICAL: Authentication Failed (Invalid Credentials or Registration Failed).");
        alert("Authentication failed. Please check credentials or ensure registration was successful."); 
        location.reload(); 
        return; 
    }

    // Handle DM/UserList updates
    if (!dmManager) return;
    
    if (raw.startsWith("USERS:")) dmManager.updateUserList(raw);
    
    if (raw.startsWith("DM:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }
    // HISTORY messages (DM:sender:content) are also handled by handleIncomingDM
};

const handleStatus = (act) => {
    UI.setStatus(act);
    if(act) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
};


const client = new SocketClient(handleIncoming, handleStatus);


// --- EMOJI & MESSAGE LOGIC ---

const emojis = ["😀","😂","😍","🥺","😎","👍","👎","🔥","❤️","✅","🎉","🤔","😭","👀","🙌","✨","💩","🤡","💀","💪","🙏","👋","🌹","🍀"];
const btnEmoji = document.getElementById('btn-emoji');

emojis.forEach(em => {
    const s = document.createElement('span');
    s.className = 'emoji-btn';
    s.innerText = em;
    s.onclick = () => {
        inpMsg.value += em;
        inpMsg.focus();
    };
    if (emojiPicker) emojiPicker.appendChild(s);
});

if (btnEmoji) {
    btnEmoji.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (emojiPicker) emojiPicker.classList.toggle('hidden');
    });
}

document.addEventListener('click', (e) => {
    if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== btnEmoji && !btnEmoji.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

DMManager.prototype.renderMessageBubble = function(msg) {
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    div.className = `msg-wrapper ${msg.isMe ? 'right' : 'left'}`;
    div.innerHTML = `<div class="msg ${msg.isMe ? 'msg-me' : 'msg-other'}">${msg.text}<span class="msg-time">${time}</span></div>`;
    document.getElementById('chat-area').appendChild(div);
};

if (document.getElementById('form-chat')) {
    document.getElementById('form-chat').addEventListener('submit', (e) => {
        e.preventDefault();
        const txt = inpMsg.value.trim();
        if(txt && dmManager) {
            dmManager.sendDM(txt);
            inpMsg.value = "";
            if (emojiPicker) emojiPicker.classList.add('hidden');
        }
    });
}

if (document.getElementById('btn-logout')) {
    document.getElementById('btn-logout').addEventListener('click', () => { client.disconnect(); location.reload(); });
}