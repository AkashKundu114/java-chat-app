import { DOM } from './domManager.js';

export class DMManager {
    constructor(currentUser, onSendMessage) {
        this.currentUser = currentUser;
        this.onSendMessage = onSendMessage;
        this.activeChatUser = null;
        this.chats = {}; 
        this.users = []; 
    }

    updateUserList(rawString) {
        const listPart = rawString.substring(6);
        if (!listPart) return;

        this.users = listPart.split(',').map(u => {
            const match = u.match(/(.*)\((.*)\)/);
            return { name: match[1], status: match[2] };
        });
        this.renderSidebar();
    }

    renderSidebar() {
        DOM.sidebarList.innerHTML = "";
        this.users.forEach(u => {
            if (u.name === this.currentUser) return; 

            const div = document.createElement('div');
            div.className = `p-3 rounded-lg cursor-pointer hover:bg-slate-800 flex justify-between items-center ${this.activeChatUser === u.name ? 'bg-indigo-900/50 border border-indigo-500/50' : ''}`;
            div.innerHTML = `
                <span class="text-white font-medium">${u.name}</span>
                <span class="text-[10px] ${u.status === 'Online' ? 'text-green-400' : 'text-slate-500'}">● ${u.status}</span>
            `;
            div.onclick = () => this.openChat(u.name);
            DOM.sidebarList.appendChild(div);
        });
    }

    openChat(username) {
        this.activeChatUser = username;
        DOM.chatHeaderTitle.innerText = `Chat with ${username}`;
        DOM.chatArea.innerHTML = ""; 
        this.renderSidebar(); 
        
        if (!this.chats[username]) this.chats[username] = [];
        this.chats[username].forEach(msg => this.renderMessageBubble(msg));
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    }

    handleIncomingDM(sender, text) {
        if (!this.chats[sender]) this.chats[sender] = [];
        this.chats[sender].push({ sender: sender, text: text, isMe: false });

        if (this.activeChatUser === sender) {
            this.renderMessageBubble({ sender: sender, text: text, isMe: false });
            DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
        } else {
        }
    }

    sendDM(text) {
        if (!this.activeChatUser) return;
        
        if (!this.chats[this.activeChatUser]) this.chats[this.activeChatUser] = [];
        this.chats[this.activeChatUser].push({ sender: "Me", text: text, isMe: true });
        
        this.renderMessageBubble({ sender: "Me", text: text, isMe: true });
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;

        this.onSendMessage(`TO:${this.activeChatUser}:${text}`);
    }

    renderMessageBubble(msg) {
        const div = document.createElement('div');
        div.className = `flex w-full mb-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`;
        div.innerHTML = `
            <div class="max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}">
                ${msg.text}
            </div>
        `;
        DOM.chatArea.appendChild(div);
    }
}