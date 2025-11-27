import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LogIn, Search, LogOut, Send, Paperclip, Smile, ArrowLeft, MoreVertical, Terminal, WifiOff } from 'lucide-react';
import ReactDOM from 'react-dom/client'; 

const CONFIG = {
    DEFAULT_IP: "johnnywalker.loca.lt", 
    BRIDGE_PORT: 8080,
    EMOJIS: ['🚀', '💻', '💡', '✅', '☕', '🔥', '⚙️', '🤖', '🔒', '🎉', '🤯', '🥸', '🥶', '🥵', '🥳']
};

const useWebSocket = (handleMessage) => {
    const [isConnected, setIsConnected] = useState(false);
    const clientRef = useRef(null);

    const connect = useCallback((ip, postConnectCallback) => {
        const isSecure = ip.includes("loca.lt");
        const url = isSecure ? `wss://${ip}` : `ws://${ip}:${CONFIG.BRIDGE_PORT}`;
        
        console.log(`Attempting connection to: ${url}`);

        const newClient = new WebSocket(url);
        clientRef.current = newClient;

        newClient.onopen = () => {
            setIsConnected(true);
            console.log("WebSocket connected.");
            if (postConnectCallback) postConnectCallback();
        };

        newClient.onmessage = (event) => {
            handleMessage(event.data);
        };

        newClient.onclose = () => {
            setIsConnected(false);
            console.log("WebSocket closed.");
        };

        newClient.onerror = (err) => {
            console.error("WebSocket Error:", err);
            setIsConnected(false);
        };
    }, [handleMessage]);

    const send = useCallback((message) => {
        if (clientRef.current && clientRef.current.readyState === WebSocket.OPEN) {
            clientRef.current.send(message);
        } else {
            console.warn("Attempted to send, but socket is closed or not ready.");
        }
    }, []);

    const disconnect = useCallback(() => {
        if (clientRef.current) {
            clientRef.current.close();
            clientRef.current = null;
        }
    }, []);

    return { connect, send, disconnect, isConnected };
};

const App = () => {
    const [view, setView] = useState('login'); 
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [debugLog, setDebugLog] = useState(['SYSTEM READY...']);
    const [users, setUsers] = useState([]); 
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const chatAreaRef = useRef(null);
    const loginIPRef = useRef(CONFIG.DEFAULT_IP);

    const log = useCallback((msg) => {
        const time = new Date().toLocaleTimeString().split(' ')[0];
        setDebugLog(prev => {
            const newLog = [...prev.slice(-3), `[${time}] ${msg}`];
            return newLog;
        });
        console.log(`[APP LOG] ${msg}`);
    }, []);

    const scrollToBottom = () => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    };

    const handleIncomingMessage = useCallback((rawText) => {
        log(`RX: ${rawText}`);
        
        const { disconnect, send } = clientState; 
        
        if (rawText === "AUTH_REQUIRED") return;
        
        if (rawText.startsWith("AUTH_SUCCESS:")) {
            const user = rawText.split(":")[1];
            setCurrentUser(user);
            setView('contacts'); 
            log(`Login SUCCESS as ${user}.`);
            return;
        }
        
        if (rawText === "AUTH_FAILED") {
            log("CRITICAL: Auth Failed. Credentials rejected.");
            alert("Login/Registration Failed. Check credentials or try REGISTER.");
            disconnect();
            return;
        }

        if (rawText.startsWith("USERS:")) {
            const listPart = rawText.substring(6);
            if (!listPart) return;
            const userList = listPart.split(',').map(u => {
                const match = u.match(/(.*)\((.*)\)/);
                return match ? { name: match[1], status: match[2], messages: [] } : { name: u, status: 'Unknown', messages: [] };
            }).filter(u => u.name !== currentUser);
            
            setUsers(prevUsers => {
                return userList.map(newUser => {
                    const existing = prevUsers.find(u => u.name === newUser.name);
                    return existing ? { ...newUser, messages: existing.messages } : newUser;
                });
            });
            return;
        }
        
        if (rawText.startsWith("DM:") || rawText.startsWith("HISTORY:")) {
            const parts = rawText.split(":", 3);
            if (parts.length < 3) return;
            const sender = parts[1];
            const content = parts[2];
            
            const isMe = sender === currentUser;
            const targetUser = isMe ? activeChatUser : sender;

            if (targetUser && targetUser === activeChatUser) {
                 setUsers(prevUsers => prevUsers.map(u => 
                    u.name === targetUser ? { ...u, messages: [...(u.messages || []), { sender, content, isMe }] } : u
                ));
            }
            
            scrollToBottom();
        }

    }, [currentUser, activeChatUser, log]); 

    const clientState = useWebSocket(handleIncomingMessage);
    const { connect, send, disconnect, isConnected } = clientState; 

    useEffect(() => {
        scrollToBottom();
    }, [users, activeChatUser]);

    useEffect(() => {
        if (!isConnected && currentUser) {
            log("Connection dropped. Resetting...");
            setCurrentUser(null);
            setView('login');
        }
    }, [isConnected, currentUser, log]);

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        if (!username || !password) {
            alert("Username and Password required.");
            return;
        }
        
        const authType = isRegistering ? "REGISTER" : "LOGIN";
        const authPacket = `AUTH:${authType}:${username}:${password}`;
        
        log(`Attempting to ${authType}...`);
        
        connect(loginIPRef.current, () => {
            send(authPacket);
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        const text = messageInput.trim();
        if (!text || !activeChatUser) return;

        setUsers(prevUsers => prevUsers.map(u => 
            u.name === activeChatUser ? { ...u, messages: [...(u.messages || []), { sender: currentUser, content: text, isMe: true }] } : u
        ));

        send(`TO:${activeChatUser}:${text}`);
        setMessageInput('');
        scrollToBottom();
    };
    
    const handleContactClick = (user) => {
        setActiveChatUser(user.name);
        
        if (window.innerWidth < 768) {
            setView('chat');
        }

        send(`HISTORY:${user.name}`);
        
        setUsers(prevUsers => prevUsers.map(u => 
             u.name === user.name ? { ...u, messages: [] } : u
        ));
    };
    
    const handleLogout = () => {
        disconnect();
        setCurrentUser(null);
        setView('login');
        window.location.reload();
    };
    
    const renderMessageBubble = (msg, currentUser, index) => {
        const isMe = msg.sender === currentUser;
        return (
            <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`msg p-2 max-w-[65%] ${isMe ? 'msg-me' : 'msg-other'}`}>
                    <p className="text-sm">{msg.content}</p>
                    <span className="msg-time text-[10px] block text-right mt-1 text-[#999]">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </div>
        );
    };

    const LoginCard = () => (
        <form onSubmit={handleLoginSubmit} className="login-card p-8 bg-[#222] border-4 border-[#00FFFF] shadow-[4px_4px_0_#00A3A3]">
            <h2 className="login-title text-[#00FFFF] mb-8">{isRegistering ? 'REGISTER NEW USER' : 'SECURE LOGIN'}</h2>
            
            {/* Debug Console */}
            <div className="debug-console h-10 overflow-y-auto text-xs text-[#00FFFF] bg-[#111] p-2 mb-4 border border-[#444]">
                {debugLog.map((line, index) => <p key={index} className="leading-3">{line}</p>)}
            </div>

            {/* Hidden Bridge URL Input */}
            <input type="hidden" className="input-box" value={loginIPRef.current} onChange={(e) => loginIPRef.current = e.target.value} />
            
            <input 
                type="text" 
                placeholder="Username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-box w-full p-3 mb-4 bg-[#111] border-2 border-[#444] text-white focus:border-[#00FFFF]"
                required
            />
            <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-box w-full p-3 mb-6 bg-[#111] border-2 border-[#444] text-white focus:border-[#00FFFF]"
                required
            />

            <button type="submit" disabled={isConnected} className="btn btn-primary bg-[#00FFFF] text-black font-bold w-full p-3 mb-3 hover:bg-[#00AAAA] shadow-[3px_3px_0_#00A3A3]">
                <LogIn className="w-5 h-5" /> {isRegistering ? 'REGISTER' : 'LOGIN'}
            </button>
            
            <button 
                type="button" 
                onClick={() => setIsRegistering(p => !p)} 
                className="btn btn-secondary text-white bg-[#444] hover:bg-[#555] w-full p-2 border-none"
            >
                {isRegistering ? 'Already registered? LOGIN' : 'Don\'t have an account? REGISTER'}
            </button>
        </form>
    );

    const NavPanel = () => (
        <aside className="nav-panel bg-[#222] border-r-2 border-[#00FFFF] w-[60px] flex flex-col justify-between items-center h-full">
            <div className="nav-top">
                <span className="company-header text-[#00FFFF] text-[10px] mt-4 transform -rotate-90 origin-top-left absolute left-1/2 top-4">JOHNNY WALKER CO.</span>
                <div className="nav-icons mt-16 space-y-4">
                    <div className="nav-icon active bg-[#111] border-2 border-[#00FFFF] text-[#00FFFF]"><Terminal className="w-5 h-5" /></div>
                </div>
            </div>
            <div className="nav-bottom">
                 <button onClick={handleLogout} className="nav-icon logout text-red-500 hover:text-[#00FFFF]"><LogOut className="w-6 h-6" /></button>
            </div>
        </aside>
    );

    const ContactsPanel = () => (
        <aside id="sidebar-panel" className="contact-panel bg-[#1A1A1A] border-r border-[#444] w-[250px] flex flex-col h-full overflow-hidden">
            <div className="search-bar p-3 border-b border-[#444]">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#999] w-4 h-4" />
                    <input type="text" placeholder="Search contacts..." className="w-full p-2 pl-8 bg-[#111] border border-[#444] text-white text-sm focus:border-[#00FFFF] focus:outline-none" />
                </div>
            </div>
            
            <div className="contact-section flex-grow overflow-y-auto no-scrollbar p-3">
                <div className="section-title text-[#00A3A3] font-bold text-xs mb-2">PEOPLE ({users.length})</div>
                {users.length === 0 ? (
                    <p className="text-center text-[#999] text-xs pt-4">{isConnected ? 'Waiting for users...' : 'Disconnected'}</p>
                ) : (
                    users.map(user => (
                        <div 
                            key={user.name}
                            className={`contact-item p-2 mb-1 cursor-pointer flex items-center justify-between border-2 border-transparent transition duration-100 ${activeChatUser === user.name ? 'border-[#00FFFF] bg-[#333]' : 'hover:bg-[#111]'}`}
                            onClick={() => handleContactClick(user)}
                        >
                            <div className="flex items-center">
                                <div className="avatar-small bg-[#00A3A3] text-black font-bold w-8 h-8 flex items-center justify-center text-sm mr-3">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <span className="contact-name text-white block text-sm">{user.name}</span>
                                    <span className={`text-[10px] ${user.status === 'Online' ? 'text-[#00FF00]' : 'text-[#999]'}`}>
                                        {user.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );

    const ChatPanel = () => (
        <main id="main-chat-panel" className={`chat-main-panel bg-[#1A1A1A] flex flex-col h-full w-full ${activeChatUser ? '' : 'hidden lg:flex'}`}>
            {/* Header */}
            <div className="chat-header p-3 flex justify-between items-center border-b-2 border-[#00FFFF] bg-[#222] flex-shrink-0">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setView('contacts')} className="mobile-only text-white lg:hidden"><ArrowLeft className="w-5 h-5" /></button>
                    <div className="avatar-small bg-[#00A3A3] text-black w-8 h-8 flex items-center justify-center text-sm">
                        {activeChatUser?.charAt(0) || '?'}
                    </div>
                    <div>
                        <span className="chat-header-name text-white font-bold block">{activeChatUser || 'Select Contact'}</span>
                        <span className={`chat-header-status text-xs ${currentChat?.status === 'Online' ? 'text-[#00FF00]' : 'text-[#999]'}`}>
                            {currentChat?.status || (isConnected ? 'DISCONNECTED' : 'OFFLINE')}
                        </span>
                    </div>
                </div>
                <div className="flex space-x-3 text-white">
                    <MoreVertical className="w-5 h-5 cursor-pointer" />
                </div>
            </div>

            {/* Messages Area */}
            <div ref={chatAreaRef} id="chat-area" className="chat-messages p-4 overflow-y-auto no-scrollbar flex-grow bg-[#1A1A1A]">
                {(currentChat?.messages?.length === 0 && !activeChatUser) && (
                    <div className="text-center text-[#999] pt-10">Select a user to begin chatting.</div>
                )}
                {currentChat?.messages.map((msg, index) => renderMessageBubble(msg, currentUser, index))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="chat-input-container p-3 border-t-2 border-[#00FFFF] bg-[#222] flex-shrink-0">
                <input type="file" id="inp-file-upload" className="hidden" accept="image/*" />
                <button type="button" className="input-action-btn w-10 h-10 border-2 border-[#444] text-[#999] hover:text-[#00FFFF]"><Paperclip className="w-5 h-5" /></button>
                
                <input 
                    id="inp-message" 
                    type="text" 
                    placeholder="ENTER MESSAGE / COMMAND..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="message-input flex-grow p-2 border-2 border-[#444] bg-[#1A1A1A] text-white focus:outline-none focus:border-[#00FFFF]" 
                    disabled={!activeChatUser}
                />
                
                <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="input-action-btn w-10 h-10 border-2 border-[#444] text-[#999] hover:text-[#00FFFF]"><Smile className="w-5 h-5" /></button>
                <button type="submit" disabled={!activeChatUser} className={`input-action-btn send-btn w-10 h-10 bg-[#00FFFF] text-black font-bold hover:bg-[#00AAAA]`}>
                    <Send className="w-5 h-5" />
                </button>
            </form>

            {/* Emoji Picker */}
            <div id="emoji-picker" className={`absolute right-4 bottom-16 bg-[#222] border-2 border-[#00FFFF] p-2 grid grid-cols-5 gap-2 w-48 h-40 overflow-y-auto z-50 ${showEmojiPicker ? '' : 'hidden'}`}>
                {CONFIG.EMOJIS.map((emoji, index) => (
                    <span key={index} className="emoji-btn text-2xl cursor-pointer hover:bg-[#1A1A1A]" onClick={() => { setMessageInput(p => p + emoji); setShowEmojiPicker(false); }}>
                        {emoji}
                    </span>
                ))}
            </div>
        </main>
    );
};

const renderMessageBubble = (msg, currentUser, index) => {
    const isMe = msg.sender === currentUser;
    return (
        <div key={index} className={`msg-wrapper ${isMe ? 'right' : 'left'}`}>
            <div className={`msg p-2 max-w-[65%] ${isMe ? 'msg-me' : 'msg-other'}`}>
                <p className="text-sm">{msg.content}</p>
                <span className="msg-time text-[10px] block text-right mt-1 text-[#999]">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
        </div>
    );
};

export default App;