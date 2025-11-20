import { SocketClient } from './core/socketClient.js';
import { SETTINGS } from './config/settings.js'; 

lucide.createIcons();

const loginTitle = document.getElementById('login-title');
const btnSubmitAuth = document.getElementById('btn-submit-auth');
const btnToggleMode = document.getElementById('btn-toggle-mode');
const inpUsername = document.getElementById('inp-username');
const inpPassword = document.getElementById('inp-password');
const ipInput = document.getElementById('inp-ip'); 
const inpMsg = document.getElementById('inp-message');
const btnEmoji = document.getElementById('btn-emoji');
const emojiPicker = document.getElementById('emoji-picker');

let currentUser = "";
let dmManager = null;
let isRegistering = false; 

const debugBox = document.getElementById('debug-console');

function debug(msg) {
    const time = new Date().toLocaleTimeString().split(' ')[0];
    if(debugBox) debugBox.innerHTML += `<div>> [${time}] ${msg}</div>`;
    if(debugBox) debugBox.scrollTop = debugBox.scrollHeight;
    console.log(msg);
}

document.addEventListener('DOMContentLoaded', () => {
    debug("SYSTEM READY: Waiting for connection.");
    
    if (ipInput && SETTINGS.DEFAULT_IP) {
        ipInput.value = SETTINGS.DEFAULT_IP;
        debug("CONFIG: Tunnel IP set to " + SETTINGS.DEFAULT_IP);
    }

    btnSubmitAuth.addEventListener('click', handleAuthSubmit);
    btnToggleMode.addEventListener('click', toggleAuthMode);
    
    const logoutBtn = document.getElementById('logout-icon-small');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            client.disconnect();
            location.reload();
        });
    }

    const btnAttach = document.getElementById('btn-attach');
    const inpFileUpload = document.getElementById('inp-file-upload');
    if (btnAttach && inpFileUpload) {
        btnAttach.addEventListener('click', () => {
            inpFileUpload.click();
        });
        inpFileUpload.addEventListener('change', () => {
            debug("FILE: Image selected (Upload not implemented).");
            if (dmManager && inpFileUpload.files.length > 0) {
                 dmManager.sendDM(`(Attachment: ${inpFileUpload.files[0].name})`);
            }
            inpFileUpload.value = '';
        });
    }

    initEmojiPicker();
    
    toggleAuthMode(false);
});


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
        debug("ERROR: Missing credentials.");
        return;
    }
    
    if (!ip || ip.includes("your-subdomain")) {
        debug("CRITICAL ERROR: Tunnel IP not set.");
        alert("CRITICAL: Please set the correct LocalTunnel/Ngrok URL in settings.js.");
        return;
    }
    
    const authType = isRegistering ? "REGISTER" : "LOGIN";
    const authPacket = `AUTH:${authType}:${user}:${pass}`;
    
    debug(`AUTH: Attempting ${authType} to ${ip}`);
    
    client.connect(ip, () => {
        debug("SEND: Auth Packet.");
        client.send(authPacket);
    });
}

const emojis = ["😀","😂","😍","😎","👍","👎","🔥","❤️","✅","🎉","🤔","😭","👀","💪","🙏","👋","🌹","🍀","🚀","💻","☕","🍕"];

function initEmojiPicker() {
    if (!emojiPicker) return;

    emojis.forEach(em => {
        const s = document.createElement('span');
        s.className = 'emoji-btn';
        s.innerText = em;
        s.onclick = (e) => {
            e.preventDefault();
            if (inpMsg) inpMsg.value += em;
            if (emojiPicker) emojiPicker.classList.add('hidden');
        };
        emojiPicker.appendChild(s);
    });
    
    if (btnEmoji) {
        btnEmoji.addEventListener('click', (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            if (emojiPicker) emojiPicker.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== btnEmoji) {
            emojiPicker.classList.add('hidden');
        }
    });
}


const handleIncoming = (raw) => {
    debug("RX: " + raw);

    if (raw.startsWith("AUTH_REQUIRED")) return; 
    
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        debug(`SUCCESS: Logged in as ${currentUser}.`);
        
        UI.toggleLogin(false); 
        
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    
    if (raw === "AUTH_FAILED") { 
        debug("ERROR: Authentication Failed.");
        alert("Authentication failed. Check credentials or register a new user."); 
        UI.toggleLogin(true);
        return; 
    }

    if (!dmManager) return;
    
    if (raw.startsWith("USERS:")) dmManager.updateUserList(raw);
    
    if (raw.startsWith("DM:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }

    if (raw.startsWith("DM:") && raw.includes("Attachment:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }
};

const handleStatus = (act) => {
    const loginLayer = document.getElementById('layer-login');
    if (loginLayer && act) loginLayer.classList.add('hidden');
    
    UI.setStatus(act);
    if(act) debug("WebSocket Connected!");
    else debug("WebSocket Disconnected/Failed");
};


const client = new SocketClient(handleIncoming, handleStatus);


class DMManager {
    constructor(currentUser, onSendMessage) {
        this.currentUser = currentUser;
        this.onSendMessage = onSendMessage;
        this.activeChatUser = null; 
        this.users = []; 

        const backBtn = document.getElementById('btn-back-contact');
        if(backBtn) backBtn.addEventListener('click', () => this.toggleMobileView('list'));
        
        const userHeader = document.getElementById('chat-header-name');
        if(userHeader) userHeader.innerText = currentUser;
        
        const avatar = document.getElementById('chat-header-avatar');
        if(avatar) avatar.innerText = currentUser.charAt(0).toUpperCase();

        const avatarSmall = document.querySelector('.nav-icon.active .avatar-small');
        if(avatarSmall) avatarSmall.innerText = currentUser.charAt(0).toUpperCase();

        if (document.getElementById('form-chat')) {
            document.getElementById('form-chat').addEventListener('submit', (e) => {
                e.preventDefault();
                const txt = inpMsg.value.trim();
                if(txt && this.activeChatUser) {
                    this.sendDM(txt);
                    inpMsg.value = "";
                }
            });
        }
    }

    updateUserList(rawString) {
        const listPart = rawString.substring(6);
        if (!listPart) return;
        this.users = listPart.split(',').map(u => {
            const match = u.match(/(.*)\((.*)\)/);
            if(match) return { name: match[1], status: match[2] };
            return { name: u, status: 'Offline' };
        }).filter(u => u.name !== this.currentUser);

        this.renderSidebar();
    }

    renderSidebar() {
        const sidebarList = document.getElementById('sidebar-list');
        if (!sidebarList) return;

        sidebarList.innerHTML = "";
        this.users.forEach(u => {
            const isActive = this.activeChatUser === u.name;
            const div = document.createElement('div');
            
            div.className = `contact-item ${isActive ? 'active' : ''}`;
            div.innerHTML = `
                <div style="display: flex; align-items: center; min-width: 0;">
                    <div class="avatar-small">${u.name.charAt(0).toUpperCase()}</div>
                    <div class="contact-info">
                        <span class="contact-name">${u.name}</span>
                        <span class="last-message">${u.status}</span>
                    </div>
                </div>
                <div style="width: 8px; height: 8px; border-radius: 0; background-color: ${u.status === 'Online' ? 'var(--online-green)' : 'var(--text-secondary)'}; box-shadow: 1px 1px 0 black;"></div>
            `;
            
            div.onclick = () => {
                this.openChat(u.name);
            };
            sidebarList.appendChild(div);
        });
    }

    openChat(username) {
        this.activeChatUser = username;
        
        const headerName = document.getElementById('chat-header-name');
        const headerAvatar = document.getElementById('chat-header-avatar');
        
        if (headerName) headerName.innerText = username;
        if (headerAvatar) headerAvatar.innerText = username.charAt(0).toUpperCase();

        document.getElementById('chat-area').innerHTML = ""; 
        
        this.toggleMobileView('chat');
        this.renderSidebar(); 
        
        this.onSendMessage(`HISTORY:${username}`);
    }

    toggleMobileView(view) {
        const sidebar = document.getElementById('sidebar-panel');
        const chatPanel = document.getElementById('main-chat-panel');

        if (window.innerWidth < 768) {
            if (view === 'chat') {
                sidebar.classList.add('hidden');
                chatPanel.classList.remove('hidden');
            } else {
                sidebar.classList.remove('hidden');
                chatPanel.classList.add('hidden');
            }
        }
    }

    handleIncomingDM(sender, text) {
        const relevant = (sender === this.activeChatUser) || (sender === this.currentUser && this.activeChatUser);
        
        if (relevant) {
            const isMe = (sender === this.currentUser);
            this.renderMessageBubble({ text: text, isMe: isMe });
        }
    }

    sendDM(text) {
        if (!this.activeChatUser) return;
        this.renderMessageBubble({ text: text, isMe: true });
        this.onSendMessage(`TO:${this.activeChatUser}:${text}`);
    }

    renderMessageBubble(msg) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const isMe = msg.isMe;

        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${isMe ? 'right' : 'left'}`;
        
        const bubble = document.createElement('div');
        bubble.className = `msg ${isMe ? 'msg-me' : 'msg-other'}`;
        
        bubble.innerHTML = `
            ${msg.text}
            <span class="msg-time">${time}</span>
        `;
        
        document.getElementById('chat-area').appendChild(wrapper);
        wrapper.appendChild(bubble);
        
        document.getElementById('chat-area').scrollTop = document.getElementById('chat-area').scrollHeight;
    }
}