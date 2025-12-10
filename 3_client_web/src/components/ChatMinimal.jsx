import React, { useState, useEffect, useRef } from 'react';
import { useChatBridge } from '../hooks/useChatBridge';

const POPULAR_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", 
  "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", 
  "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", 
  "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", 
  "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", 
  "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "🤡", "👻", 
  "💀", "👽", "🤖", "💩", "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", 
  "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", 
  "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🧠", "👀", "👁️"
];

const ChatMinimal = () => {
  const { socket, messages, contacts, user, authStatus, login } = useChatBridge();
  
  const [inputValue, setInputValue] = useState('');
  const [activeContact, setActiveContact] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [localMessages, setLocalMessages] = useState([]); 
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const relevantServerMessages = messages
    .filter(msg => 
      activeContact && (
        msg.realSenderName === activeContact.name || 
        (msg.realSenderName === user && activeContact.name)
      )
    )
    .map((msg, index) => ({ ...msg, _source: 'server', _index: index }));

  const relevantLocalMessages = localMessages
    .filter(msg => activeContact && msg.to === activeContact.name)
    .map((msg, index) => ({ ...msg, _source: 'local', _index: index }));

  const allMessages = [...relevantServerMessages, ...relevantLocalMessages].sort((a, b) => {
      const timeDiff = a.id - b.id;
      if (timeDiff !== 0) return timeDiff;

      if (a._source === 'server' && b._source === 'server') {
          return a._index - b._index;
      }
      if (a._source === 'server') return -1;
      return 1;
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [allMessages, activeContact, showEmojiPicker]);

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeContact || !socket) return;
    
    socket.send(`TO:${activeContact.name}:${inputValue}`);
    
    const newMsg = {
        id: Date.now(),
        realSenderName: user,
        text: inputValue,
        sender: 'me',
        to: activeContact.name, 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setLocalMessages(prev => [...prev, newMsg]);

    setInputValue('');
    setShowEmojiPicker(false);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    login(loginUser, loginPass, isRegisterMode);
  };

  const handleEmojiClick = (emoji) => {
    setInputValue((prev) => prev + emoji);
  };

  if (authStatus !== 'authenticated') {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-gray-50">
        <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="z-10 w-full max-w-sm p-8 bg-white border border-gray-200 shadow-xl rounded-2xl">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 text-white bg-yellow-400 shadow-lg rounded-xl shadow-yellow-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">{authStatus === 'disconnected' ? 'Connecting...' : isRegisterMode ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="mt-2 text-sm text-gray-400">Sign in to continue to your workspace</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Username</label>
              <input className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 outline-none transition-all bg-gray-50 font-medium" type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} disabled={authStatus === 'disconnected'} placeholder="e.g. alice" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-50 outline-none transition-all bg-gray-50 font-medium" type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} disabled={authStatus === 'disconnected'} placeholder="••••••••" />
            </div>
            <button type="submit" disabled={authStatus === 'disconnected'} className="w-full py-3 text-sm font-bold text-white transition-all duration-200 transform bg-gray-900 rounded-lg shadow-md hover:bg-black hover:shadow-lg active:scale-95">
              {isRegisterMode ? 'Sign Up' : 'Log In'}
            </button>
          </form>
          <p className="mt-6 text-xs font-medium text-center text-gray-500">
            {isRegisterMode ? "Already have an account?" : "Don't have an account?"} <span className="ml-1 text-yellow-600 cursor-pointer hover:underline" onClick={() => setIsRegisterMode(!isRegisterMode)}>{isRegisterMode ? "Log in" : "Sign up"}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      
      {/* 1. SIDEBAR (Responsive) */}
      <div className={`${activeContact ? 'hidden' : 'flex'} md:flex w-full md:w-80 flex-col bg-gray-100 border-r border-gray-200 z-20 transition-all duration-300`}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-bold leading-none tracking-tight text-gray-900">Messages</h1>
            <p className="text-xs font-medium text-gray-500 mt-1.5">Logged in as <span className="text-gray-900">{user}</span></p>
          </div>
          <div className="relative">
            <input className="w-full px-4 py-2 pl-10 text-sm font-medium placeholder-gray-400 transition-all bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-100 focus:border-yellow-200" placeholder="Search chats..." />
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>
        
        <div className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
          {contacts.filter(c => c.name !== user).map((contact) => (
            <button key={contact.id} onClick={() => setActiveContact(contact)} className={`w-full text-left p-3 rounded-xl transition-all group ${activeContact?.id === contact.id ? 'bg-gray-900 shadow-md' : 'hover:bg-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${activeContact?.id === contact.id ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 group-hover:bg-white group-hover:shadow-sm'}`}>
                  {contact.name.charAt(0).toUpperCase()}
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${contact.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`text-sm font-bold truncate ${activeContact?.id === contact.id ? 'text-white' : 'text-gray-800'}`}>{contact.name}</span>
                  </div>
                  <p className={`text-xs truncate ${activeContact?.id === contact.id ? 'text-gray-400' : 'text-gray-500'}`}>{contact.status === 'online' ? 'Active now' : 'Offline'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. CHAT AREA (Responsive) */}
      <div className={`${activeContact ? 'flex' : 'hidden'} md:flex relative flex-col flex-1 min-w-0 bg-white`}>
        <div className="absolute inset-0 z-0 bg-white" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between h-16 px-4 border-b md:px-6 bg-white/80 backdrop-blur-md border-gray-200/50">
          {activeContact ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveContact(null)} className="p-1 mr-1 text-gray-600 rounded-full md:hidden hover:bg-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <div className="flex items-center justify-center font-bold text-white rounded-full shadow-sm w-9 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500">{activeContact.name.charAt(0).toUpperCase()}</div>
              <div className="leading-tight">
                <h2 className="text-sm font-bold text-gray-900">{activeContact.name}</h2>
                <p className="text-xs font-medium text-gray-500">{activeContact.status}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-400">No chat selected</div>
          )}
        </div>

        {/* Messages Canvas */}
        <div className="z-10 flex-1 p-4 pb-24 space-y-6 overflow-y-auto md:p-6 md:pb-6">
          {!activeContact && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="flex items-center justify-center w-16 h-16 mb-4 border border-gray-100 shadow-sm bg-gray-50 rounded-2xl">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              </div>
              <p className="text-sm font-medium">Select a contact to start messaging</p>
            </div>
          )}

          {allMessages.map((msg, index) => {
            const isMe = msg.realSenderName === user;
            return (
              <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm text-sm relative border ${isMe ? 'bg-yellow-100 border-yellow-200 text-gray-800 rounded-br-none' : 'bg-[#E1F5FE] border-[#E1F5FE] text-gray-900 rounded-bl-none'}`}>
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
                  <span className={`text-[10px] block mt-1.5 font-bold ${isMe ? 'text-yellow-700/60' : 'text-blue-900/40'} text-right`}>{msg.time}</span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="z-20 p-3 bg-white border-t border-gray-100 md:p-4">
          <div className="relative flex items-center max-w-4xl gap-2 p-2 mx-auto bg-white border border-gray-200 shadow-sm md:shadow-lg rounded-2xl">
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute right-0 grid w-64 h-64 grid-cols-6 gap-2 p-3 overflow-y-auto bg-white border border-gray-200 shadow-xl bottom-16 rounded-2xl animate-fade-in-up" style={{ zIndex: 100 }}>
                {POPULAR_EMOJIS.map((emoji, idx) => (
                  <button key={idx} onClick={() => handleEmojiClick(emoji)} className="p-1 text-xl transition-colors rounded-md hover:bg-gray-100">{emoji}</button>
                ))}
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex-1">
              <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={activeContact ? "Write a message..." : ""} disabled={!activeContact} className="w-full px-3 py-2 text-sm font-medium text-gray-800 placeholder-gray-400 bg-transparent border-none focus:ring-0" />
            </form>
            
            <button type="button" disabled={!activeContact} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </button>
            
            <button onClick={handleSendMessage} disabled={!inputValue.trim() || !activeContact} className="bg-gray-900 hover:bg-black disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl p-2.5 transition-all shadow-md transform active:scale-95">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transform rotate-90 translate-x-px" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMinimal;