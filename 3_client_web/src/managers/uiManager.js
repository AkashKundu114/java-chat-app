import { DOM } from './domManager.js';

export const UI = {
    toggleLogin: (showLogin) => {
        if (showLogin) {
            if(DOM.loginLayer) DOM.loginLayer.classList.remove('hidden');
            if(DOM.appLayer) DOM.appLayer.classList.add('hidden');
        } else {
            if(DOM.loginLayer) DOM.loginLayer.classList.add('hidden');
            if(DOM.appLayer) DOM.appLayer.classList.remove('hidden');
        }
    },
    
    setStatus: (isActive) => {
        const html = isActive ? '<span style="color:#4ade80">● Online</span>' : '<span style="color:#f87171">● Offline</span>';
        const el = document.getElementById('connection-status');
        if(el) el.innerHTML = html;
    },

    scrollToBottom: () => {
        if (DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    }
};