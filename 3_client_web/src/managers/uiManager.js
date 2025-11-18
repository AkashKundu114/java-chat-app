import { DOM } from './domManager.js';

export const UI = {
    toggleLogin: (showLogin) => {
        if (showLogin) {
            DOM.loginLayer.classList.remove('hidden');
            DOM.appLayer.classList.add('hidden');
        } else {
            DOM.loginLayer.classList.add('hidden');
            DOM.appLayer.classList.remove('hidden');
        }
    },
    
    setStatus: (isActive) => {
        const html = isActive ? '<span class="text-green-500">● Online</span>' : '<span class="text-red-500">● Offline</span>';
        if (DOM.statusText) DOM.statusText.innerHTML = html;
        if (document.getElementById('connection-status')) document.getElementById('connection-status').innerHTML = html;
    },

    scrollToBottom: () => {
        if (DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    }
};