import { DOM } from './domManager.js';

export const UI = {
    toggleLogin: (showLogin) => {
        if (showLogin) {
            DOM.loginLayer.style.display = 'flex';
            DOM.loginLayer.classList.remove('hidden');
            
            DOM.appLayer.style.display = 'none';
        } else {
            DOM.loginLayer.style.display = 'none';
            DOM.loginLayer.classList.add('hidden');
            
            DOM.appLayer.style.display = 'flex'; 
        }
    },
    
    setStatus: (isActive) => {
        const statusText = isActive ? '<span class="text-green-500">● Online</span>' : '<span class="text-red-500">● Offline</span>';
        if(DOM.statusText) DOM.statusText.innerHTML = statusText;
        if(document.getElementById('connection-status')) document.getElementById('connection-status').innerHTML = statusText;
    },

    scrollToBottom: () => {
        if(DOM.chatArea) DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
    }
};