import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { DMManager } from './managers/dmManager.js';
import { SETTINGS } from './config/settings.js'; 

lucide.createIcons();

// --- UI Elements ---
const loginTitle = document.getElementById('login-title');
const btnSubmitAuth = document.getElementById('btn-submit-auth');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const inpUsername = document.getElementById('inp-username');
const inpPassword = document.getElementById('inp-password');
const ipInput = document.getElementById('inp-ip'); 

// --- APP STATE ---
let currentUser = "";
let dmManager = null;
let isRegistering = false; 

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
    }

    // 2. Attach Listeners
    btnSubmitAuth.addEventListener('click', handleAuthSubmit);
    btnToggleMode.addEventListener('click', toggleAuthMode);
    
    // Logout listener
    const logoutBtn = document.getElementById('logout-icon-small');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            client.disconnect();
            location.reload(); // Simple way to reset state
        });
    }

    // Set initial UI state
    toggleAuthMode(false); // Set to LOGIN by default
});


// --- AUTHENTICATION HANDLERS ---

function toggleAuthMode(eventOrBool) {
    if (typeof eventOrBool === 'boolean') {
        isRegistering = eventOrBool;
    } else {
        isRegistering = !isRegistering;
    }
    
    if (isRegistering) {
        loginTitle.innerText = "CREATE NEW ACCOUNT";
        btnSubmitAuth.innerHTML = '<i data-lucide="user-plus" style="width:20px;"></i> REGISTER';
        btnToggleMode.innerHTML = 'Already registered? **LOGIN**';
    } else {
        loginTitle.innerText = "SECURE LOGIN";
        btnSubmitAuth.innerHTML = '<i data-lucide="log-in" style="width:20px;"></i> LOGIN';
        btnToggleMode.innerHTML = 'Don\'t have an account? **REGISTER**';
    }
    lucide.createIcons();
}

function handleAuthSubmit() {
    const user = inpUsername.value.trim();
    const pass = inpPassword.value.trim();
    const ip = ipInput.value.trim(); 

    if (!user || !pass) {
        alert("Username and Password are required.");
        return;
    }
    
    if (!ip || ip.includes("your-subdomain")) {
        debug("ERROR: Tunnel IP not set or is generic.");
        alert("ERROR: Please check settings.js for the correct LocalTunnel/Ngrok URL.");
        return;
    }
    
    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;
    
    debug(`Auth attempt (${authType}) to ${ip}`);
    
    // Connect with callback to send auth packet immediately after open
    client.connect(ip, () => {
        debug("Sending Auth Packet...");
        client.send(authPacket);
    });
}

// --- NETWORK HANDLER ---
const handleIncoming = (raw) => {
    debug("RX: " + raw);

    if (raw.startsWith("AUTH_REQUIRED")) return; 
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        debug(`Login Success as ${currentUser}. Switching UI.`);
        
        // CRITICAL FIX: Ensure App Layer is Displayed correctly
        document.getElementById('layer-login').style.display = 'none';
        
        // This makes the app container visible, using the CSS grid setup
        const appLayer = document.getElementById('layer-app');
        if (appLayer) appLayer.style.display = 'grid'; 

        // Set Profile Info
        const profileAvatar = document.getElementById('my-profile-avatar');
        const profileUsername = document.getElementById('my-profile-username');
        if (profileAvatar) profileAvatar.innerText = currentUser.charAt(0).toUpperCase();
        if (profileUsername) profileUsername.innerText = currentUser;

        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    
    if (raw === "AUTH_FAILED") { 
        debug("CRITICAL: Authentication Failed. Credentials mismatch.");
        alert("Authentication failed. Please check credentials or ensure registration was successful."); 
        document.getElementById('layer-login').style.display = 'flex'; // Show login again
        return; 
    }

    // Handle DM/UserList updates
    if (!dmManager) return;
    
    if (raw.startsWith("USERS:")) dmManager.updateUserList(raw);
    
    if (raw.startsWith("DM:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }
};

const handleStatus = (act) => {
    UI.setStatus(act);
    if(act) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
};

// Initialize client (requires socketClient.js to be updated with callback support)
const client = new SocketClient(handleIncoming, handleStatus);


// --- DM MANAGER PROTOTYPE (REQUIRED FOR UI RENDERING) ---
DMManager.prototype.renderMessageBubble = function(msg) {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const isMe = msg.isMe;
    
    const wrapper = document.createElement('div');
    // Ensure wrapper uses the defined CSS classes for layout
    wrapper.className = `msg-wrapper ${isMe ? 'right' : 'left'}`;
    
    wrapper.innerHTML = `
        <div class="msg ${isMe ? 'msg-me' : 'msg-other'}">
            ${msg.text}
            <span class="msg-time">${time}</span>
        </div>
    `;
    document.getElementById('chat-area').appendChild(wrapper);
};

DMManager.prototype.renderSidebar = function() {
    const sidebarList = document.getElementById('sidebar-list');
    if (!sidebarList) return;

    sidebarList.innerHTML = "";
    this.users.forEach(u => {
        if (u.name === this.currentUser) return; 

        const div = document.createElement('div');
        const isActive = this.activeChatUser === u.name;
        
        div.className = `contact-item ${isActive ? 'active' : ''}`;
        div.innerHTML = `
            <div style="display: flex; align-items: center; min-width: 0;">
                <div class="avatar-small">${u.name.charAt(0).toUpperCase()}</div>
                <div class="contact-info">
                    <span class="contact-name">${u.name}</span>
                    <span class="last-message">${u.status}</span>
                </div>
            </div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${u.status === 'Online' ? 'var(--online-green)' : 'var(--text-secondary)'};"></div>
        `;
        
        div.onclick = () => {
            // Mobile view toggle when clicking contact
            if (window.innerWidth < 768) {
                document.getElementById('sidebar-panel').classList.add('hidden');
                document.getElementById('main-chat-panel').classList.remove('hidden');
                document.getElementById('main-chat-panel').style.display = 'flex';
            }
            this.openChat(u.name);
            lucide.createIcons();
        };
        sidebarList.appendChild(div);
    });
    lucide.createIcons();
};

DMManager.prototype.openChat = function(username) {
    this.activeChatUser = username;
    const chatHeaderName = document.getElementById('chat-header-name');
    if (chatHeaderName) chatHeaderName.innerText = username;
    
    document.getElementById('chat-area').innerHTML = ""; 
    this.renderSidebar(); 
    
    // CRITICAL: Ask Server for History from MongoDB
    this.onSendMessage(`HISTORY:${username}`);
};


// --- EMOJI & INPUT LOGIC ---
const emojis = ["😀","😂","😍","😎","👍","👎","🔥","❤️","✅","🎉","🤔","😭","👀","💪","🙏","👋","🌹","🍀","🚀","💻","☕","🍕"];
const btnEmoji = document.getElementById('btn-emoji');

emojis.forEach(em => {
    const s = document.createElement('span');
    s.className = 'emoji-btn';
    s.innerText = em;
    s.onclick = () => {
        inpPassword.value += em; // Using inpPassword as a temp universal input reference since inpMsg is complex
        inpUsername.focus();
        if (inpMsg) inpMsg.value += em;
        if (inpPassword) inpPassword.value += em;
    };
    if (emojiPicker) emojiPicker.appendChild(s);
});

// Attach event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
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

    // Mobile back button logic
    if (document.getElementById('btn-back-contact')) {
        document.getElementById('btn-back-contact').addEventListener('click', () => {
            if (window.innerWidth < 768) {
                document.getElementById('sidebar-panel').classList.remove('hidden');
                document.getElementById('main-chat-panel').classList.add('hidden');
            }
        });
    }
});