import { DOM } from '../managers/domManager.js';
import { UI } from '../managers/uiManager.js';

export function renderMessage(text, type, sender = "") {
    const div = document.createElement('div');
    div.className = "flex w-full mb-2 " + (type === 'sent' ? "justify-end" : "justify-start");
    
    const bubble = document.createElement('div');
    
    if (type === 'system') {
        div.className = "flex justify-center my-4";
        bubble.className = "bg-slate-800 text-slate-500 text-xs px-3 py-1 rounded-full border border-slate-700";
        bubble.textContent = text;
    } else {
        const isMe = type === 'sent';
        bubble.className = "max-w-[80%] px-4 py-3 rounded-2xl text-sm " + 
            (isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700");
        
        if (!isMe && sender) {
            bubble.innerHTML = `<div class="text-[10px] text-indigo-400 font-bold mb-1 uppercase">${sender}</div>${text}`;
        } else {
            bubble.textContent = text;
        }
    }

    div.appendChild(bubble);
    DOM.chatContainer.appendChild(div);
    UI.scrollToBottom();
}