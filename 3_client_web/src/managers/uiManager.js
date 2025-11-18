import { DOM } from './domManager.js';

export const UI = {
    toggleLogin: (show) => {
        DOM.loginLayer.style.display = show ? 'flex' : 'none';
    },
    
    setStatus: (isActive) => {
        DOM.statusText.innerHTML = isActive 
            ? '<span class="text-green-500">● Online</span>' 
            : '<span class="text-red-500">● Offline</span>';
    },

    scrollToBottom: () => {
        DOM.chatContainer.scrollTop = DOM.chatContainer.scrollHeight;
    }
};