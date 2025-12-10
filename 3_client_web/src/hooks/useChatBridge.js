import { useState, useEffect, useRef } from 'react';

const WS_URL = 'wss://cathy-chat-app.loca.lt';

export const useChatBridge = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [user, setUser] = useState(null); 
  const [authStatus, setAuthStatus] = useState('disconnected');

  const pendingCreds = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to Bridge');
      setAuthStatus('connected');

      const saved = localStorage.getItem('chat_auth');
      if (saved) {
        try {
          const { username, password } = JSON.parse(saved);
          ws.send(`AUTH:LOGIN:${username}:${password}`);
          pendingCreds.current = { username, password };
        } catch (e) {
          localStorage.removeItem('chat_auth');
        }
      }
    };

    ws.onmessage = (event) => {
      const msg = event.data;
      console.log('Raw In:', msg);
      handleProtocol(msg, ws);
    };

    ws.onclose = () => setAuthStatus('disconnected');
    
    setSocket(ws);
    return () => ws.close();
  }, []);

  const handleProtocol = (rawMsg, ws) => {
    if (rawMsg === 'AUTH_REQUIRED') {
      setAuthStatus('pending_login');
    } 
    else if (rawMsg === 'AUTH_FAILED') {
      alert("Login Failed / Session Expired");
      setAuthStatus('connected'); 
      localStorage.removeItem('chat_auth'); 
    }
    else if (rawMsg.startsWith('AUTH_SUCCESS:')) {
      const username = rawMsg.split(':')[1];
      setUser(username);
      setAuthStatus('authenticated');

      if (pendingCreds.current) {
        localStorage.setItem('chat_auth', JSON.stringify(pendingCreds.current));
      }
    }
    else if (rawMsg.startsWith('USERS:')) {
      const rawList = rawMsg.substring(6).split(',');
      const parsedContacts = rawList
        .filter(s => s) 
        .map((s, index) => {
          const isOnline = s.includes('(Online)');
          const name = s.replace('(Online)', '').replace('(Offline)', '');
          return { id: index, name, status: isOnline ? 'online' : 'offline' };
        });
      setContacts(parsedContacts);
    }
    else if (rawMsg.startsWith('DM:')) {
      const parts = rawMsg.split(':');
      if (parts.length >= 3) {
        const sender = parts[1];
        const text = parts.slice(2).join(':'); 
        
        setMessages((prev) => [...prev, {
          id: Date.now(),
          sender: sender === user ? 'me' : 'them', 
          realSenderName: sender,
          text: text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }
  };

  const login = (username, password, isRegister) => {
    if (!socket) return;
    
    pendingCreds.current = { username, password };
    
    const type = isRegister ? 'REGISTER' : 'LOGIN';
    socket.send(`AUTH:${type}:${username}:${password}`);
  };

  const sendMessage = (recipient, text) => {
    if (!socket) return;
    socket.send(`TO:${recipient}:${text}`);
  };

  return { socket, messages, contacts, user, authStatus, login, sendMessage };
};