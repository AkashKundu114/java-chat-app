import { DOM } from './managers/domManager.js';
import { UI } from './managers/uiManager.js';
import { SocketClient } from './core/socketClient.js';
import { QRManager } from './managers/qrManager.js';
import { DMManager } from './managers/dmManager.js';

lucide.createIcons();

// --- EMOJI LOGIC ---
const emojis = ["😀","😂","😍","🥺","😎","👍","👎","🔥","❤️","✅","🎉","🤔","😭","👀","🙌","✨","💩","🤡"];
const emojiPicker = document.getElementById('emoji-picker');
const btnEmoji = document.getElementById('btn-emoji');
const inpMsg = document.getElementById('inp-message');

// 1. Build Picker
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

// 2. Toggle Picker
btnEmoji.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent closing immediately
    emojiPicker.classList.toggle('hidden');
});

// 3. Close Picker on click outside
document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== btnEmoji && !btnEmoji.contains(e.target)) {
        emojiPicker.classList.add('hidden');
    }
});

// --- OVERRIDE RENDER FUNCTION FOR NEW LAYOUT ---
// We monkey-patch DMManager's render function to use the new right/left CSS
DMManager.prototype.renderMessageBubble = function(msg) {
    const div = document.createElement('div');
    // Use 'right' for me, 'left' for others
    div.className = `msg-wrapper ${msg.isMe ? 'right' : 'left'}`;
    
    div.innerHTML = `
        <div class="msg ${msg.isMe ? 'msg-me' : 'msg-other'}">
            ${msg.text}
            <div style="font-size:10px; text-align:right; opacity:0.7; margin-top:2px;">
                ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
        </div>
    `;
    document.getElementById('chat-area').appendChild(div);
};

// --- REST OF APP LOGIC (Standard) ---
let currentUser = "";
let dmManager = null;
const placeholder = document.getElementById('camera-placeholder');

const handleIncoming = (raw) => {
    if (raw.startsWith("AUTH_REQ")) return;
    if (raw.startsWith("AUTH_SUCCESS:")) {
        currentUser = raw.split(":")[1];
        UI.toggleLogin(false);
        dmManager = new DMManager(currentUser, (packet) => client.send(packet));
        return;
    }
    if (raw === "AUTH_FAILED") { alert("Token Invalid"); location.reload(); return; }
    if (!dmManager) return;
    if (raw.startsWith("USERS:")) dmManager.updateUserList(raw);
    if (raw.startsWith("DM:")) {
        const p = raw.split(":", 3);
        if(p.length === 3) dmManager.handleIncomingDM(p[1], p[2]);
    }
};

const client = new SocketClient(handleIncoming, (act) => UI.setStatus(act));

const qr = new QRManager((t) => {
    const ip = document.getElementById('inp-ip').value.trim();
    if(!ip) { alert("IP Required"); return; }
    placeholder.innerText = "Verifying...";
    client.connect(ip);
    setTimeout(() => client.send("AUTH:"+t), 500);
});

document.getElementById('btn-activate-cam').addEventListener('click', () => {
    placeholder.style.display = 'none';
    qr.startScanner("qr-reader");
});

document.getElementById('btn-upload-qr').addEventListener('click', () => document.getElementById('inp-file-qr').click());
document.getElementById('inp-file-qr').addEventListener('change', (e) => {
    if(e.target.files[0]) qr.scanFromFile(e.target.files[0]);
});

document.getElementById('form-chat').addEventListener('submit', (e) => {
    e.preventDefault();
    const txt = inpMsg.value.trim();
    if(txt && dmManager) {
        dmManager.sendDM(txt);
        inpMsg.value = "";
        emojiPicker.classList.add('hidden'); // Close emoji on send
    }
});