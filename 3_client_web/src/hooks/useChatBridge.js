import { useState, useEffect, useRef } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export const useChatBridge = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [user, setUser] = useState(null); 
  
  const [authStatus, setAuthStatus] = useState('disconnected');

  const pendingCreds = useRef(null);
  const heartbeatInterval = useRef(null);
  const reconnectTimeout = useRef(null);
  const isMounted = useRef(true);

  const connect = () => {
    if (!isMounted.current) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to Bridge');
      setAuthStatus('connected'); 

      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("PING");
        }
      }, 30000);

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
      if (!msg || msg === 'PONG') return; 
      handleProtocol(msg, ws);
    };

    ws.onclose = () => {
      console.log("Disconnected. Attempting reconnect...");
      
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      
      if (isMounted.current) {
        reconnectTimeout.current = setTimeout(() => {
          console.log("Reconnecting...");
          connect(); 
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("Socket Error:", err);
      ws.close(); 
    };
    
    setSocket(ws);
  };

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (socket) socket.close();
    };
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

  const logout = () => {
    localStorage.removeItem('chat_auth'); 
    setUser(null);                        
    setAuthStatus('connected');           
    setContacts([]);                      
    setMessages([]);
  };

  return { socket, messages, contacts, user, authStatus, login, sendMessage, logout };
};