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
                    <div class="avatar">${u.name.charAt(0).toUpperCase()}</div>
                    <div class="flex flex-col">
                        <span class="text-white font-medium text-sm">${u.name}</span>
                        <span class="text-[10px] ${u.status === 'Online' ? 'text-green-400' : 'text-slate-500'}">
                            ${u.status === 'Online' ? '● Online' : '○ Offline'}
                        </span>
                    </div>
                </div>
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
        
        // 1. Clear local history display to avoid duplicates before fetch
        // (Optional: You could cache, but simplified here)
        
        // 2. Ask Server for history
        this.onSendMessage(`HISTORY:${username}`);
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
        // If it's a message FROM the person I'm talking to, OR a message I sent TO them (history echo)
        const otherPerson = (sender === this.currentUser) ? this.activeChatUser : sender;
        
        // Only render if it belongs to current active chat
        if (this.activeChatUser === sender || (sender === this.currentUser && this.activeChatUser)) {
            const isMe = (sender === this.currentUser);
            this.renderMessageBubble({ text: text, isMe: isMe });
            DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
        }
    }

    sendDM(text) {
        if (!this.activeChatUser) return;
        // We render optimistically
        this.renderMessageBubble({ text: text, isMe: true });
        DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
        this.onSendMessage(`TO:${this.activeChatUser}:${text}`);
    }

    renderMessageBubble(msg) {
        const div = document.createElement('div');
        div.className = `msg-wrapper ${msg.isMe ? 'right' : 'left'}`;
        div.innerHTML = `
            <div class="msg ${msg.isMe ? 'msg-me' : 'msg-other'}">
                ${msg.text}
            </div>
        `;
        DOM.chatArea.appendChild(div);
    }
}