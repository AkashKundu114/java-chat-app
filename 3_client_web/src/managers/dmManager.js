import { DOM } from './domManager.js';

export class DMManager {
    constructor(currentUser, onSendMessage) {
        this.currentUser = currentUser;
        this.onSendMessage = onSendMessage;
        this.activeChatUser = null;
        this.chats = {}; 
        this.users = []; 

        if(DOM.backBtn) {
            DOM.backBtn.addEventListener('click', () => {
                this.toggleMobileView('list');
                this.activeChatUser = null;
                this.renderSidebar();
            });
        }
    }

    updateUserList(rawString) {
        const listPart = rawString.substring(6);
        if (!listPart) return;

        this.users = listPart.split(',').map(u => {
            const match = u.match(/(.*)\((.*)\)/);
            if(match) return { name: match[1], status: match[2] };
            return { name: u, status: 'Unknown' };
        });
        this.renderSidebar();
    }

    renderSidebar() {
        DOM.sidebarList.innerHTML = "";
        this.users.forEach(u => {
            if (u.name === this.currentUser) return; 

            const div = document.createElement('div');
            const isActive = this.activeChatUser === u.name;
            
            div.className = `contact-item ${isActive ? 'active' : ''}`;
            
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="avatar ${isActive ? 'bg-indigo-600' : 'bg-slate-700'}">
                        ${u.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex flex-col">
                        <span class="text-white font-medium text-sm">${u.name}</span>
                        <span class="text-[10px] ${u.status === 'Online' ? 'text-green-400' : 'text-slate-500'}">
                            ${u.status === 'Online' ? '● Online' : '○ Offline'}
                        </span>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-slate-600"></i>
            `;
            
            div.onclick = () => {
                this.openChat(u.name);
                lucide.createIcons();
            };
            
            DOM.sidebarList.appendChild(div);
        });
        lucide.createIcons();
    }

    openChat(username) {
        this.activeChatUser = username;
        DOM.chatHeaderTitle.innerText = username;
        DOM.chatArea.innerHTML = ""; 
        
        this.toggleMobileView('chat');
        this.renderSidebar(); 
        
        if (!this.chats[username]) this.chats[username] = [];
        this.chats[username].forEach(msg => this.renderMessageBubble(msg));
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    }

    toggleMobileView(view) {
        if (view === 'chat') {
            DOM.sidebarPanel.classList.add('hidden');
            DOM.mainChatPanel.classList.remove('hidden');
            DOM.mainChatPanel.classList.add('flex');
        } else {
            DOM.sidebarPanel.classList.remove('hidden');
            DOM.sidebarPanel.classList.add('flex');
            DOM.mainChatPanel.classList.add('hidden');
            DOM.mainChatPanel.classList.remove('flex');
        }
    }

    handleIncomingDM(sender, text) {
        if (!this.chats[sender]) this.chats[sender] = [];
        this.chats[sender].push({ sender: sender, text: text, isMe: false });

        if (this.activeChatUser === sender) {
            this.renderMessageBubble({ sender: sender, text: text, isMe: false });
            DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
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
            <div class="msg-bubble ${msg.isMe ? 'msg-me' : 'msg-other'}">
                ${msg.text}
            </div>
        `;
        DOM.chatArea.appendChild(div);
    }
}