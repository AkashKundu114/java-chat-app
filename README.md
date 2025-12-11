# 🚀 Enterprise Chat Application  
A full-stack, multi-threaded chat system built with **Java (TCP Sockets)**, **Node.js (WebSocket Bridge)**, and a **Responsive Web Client** featuring a **Minimalist UI** and **MongoDB Atlas (Cloud Database)**.
Designed to demonstrate **concurrency**, **raw networking**, **offline message delivery**, and **simple login system**. 

---

## ⭐ Features

### 🔹 Multi-Threaded Java Server  
- Thread-inheritance model  
- Handles many clients simultaneously  
- Non-blocking message processing  

### 🔹 Private Direct Messaging (DM)  
- Secure 1-on-1 messaging  
- Server-side routing  

### 🔹 Offline Message Queue  
- Messages stored if the user is offline  
- Delivered automatically once the user reconnects  

### 🔹 Hybrid Socket Architecture  
- Java backend uses **raw TCP sockets**  
- Node bridge converts **WebSockets ↔ TCP**  
- Allows browsers to communicate with the Java server  

### 🔹 QR Code Login (Password-less) [Soon..] 
- Admin generates secure login tokens  
- Users scan QR from mobile to authenticate  

### 🔹 Responsive Web UI  
- Mobile-first  
- Powered by **Tailwind CSS**  
- DM sidebar, chat window  

---

## 🏛 Architecture Overview

```
┌─────────────────────────┐      ┌──────────────────────────┐      ┌──────────────────────────┐
│   Java Backend (TCP)    │◄────►│  Node.js Bridge (WS/TCP) │◄────►│  Web Client (HTML + JS)  │
│      "The Brain"        │      │      "The Translator"    │      │        "The Face"         │
└─────────────────────────┘      └──────────────────────────┘      └──────────────────────────┘
         Port 12345                        Port 8080                    Ngrok / Localhost
```

### **1. backend_java**
- Manages threads  
- Stores & routes messages  
- Handles user registration and token generation  

### **2. bridge_node**
- WebSocket server  
- Forwards browser packets to Java via raw TCP  
- Bridges modern web to traditional socket systems  

### **3. client_web**
- HTML + JavaScript frontend  
- QR login  
- Chat interface  
- Admin token generator  

---

## 🛠 Prerequisites

- **Java JDK 17+**  
- **Node.js (LTS Version)**  
- **MongoDB Atlas** Account (For the cloud database URI)
- **LocalTunnel CLI** (`npm install -g localtunnel`)
- **Git**  

---

## 🚀 Quick Start Guide

### ⬇️ Clone Repository
```bash
git clone https://github.com/AkashKundu114/java-chat-app.git
cd java-chat-app
```

---

## 1️⃣ Compile & Server Prep (Terminal 1)

This terminal starts the Java application, connects to the cloud database, and provides the administration console.

Navigate:
```bash
cd 1_backend_java
mkdir -p bin
```

Compile:
```bash
javac -cp "lib/mongo-java-driver-3.12.14.jar;src" -d bin src/com/chat/Main.java src/com/chat/services/*.java src/com/chat/threads/*.java src/com/chat/core/*.java src/com/chat/config/*.java src/com/chat/constants/*.java src/com/chat/models/*.java src/com/chat/utils/*.java
```

Server:
```bash
java -cp "lib/mongo-java-driver-3.12.14.jar;bin" com.chat.Main
```

Once the server is running, use this command to create users:
```bash
create <username> <password>
```
Example: create Akash MyPass123


---

## 2️⃣ Node Bridge Setup (Terminal 2)

This terminal runs the Node process, which translates browser WebSockets to Java TCP Sockets.

```bash
cd 2_bridge_node
npm install
npm start
```

---

## 3️⃣ Start Public Access Tunnel (Terminal 3)

This terminal provides the final, secure, and permanent public access link.

Start the permanent tunnel:
```bash
lt --port 8080 --subdomain cathy-chat-app
```

Note: This will print the public URL: [https://cathy-chat.netlify.app/](https://cathy-chat.netlify.app)

---

## 4️⃣ Launch the Web Client

Host the web folder:

**Option 1 — Netlify Drop:**  
Drag `3_client_web` into https://app.netlify.com/drop  

**Option 2 — Local Hosting:**  
```bash
python -m http.server 8000
```

---

## 🔑 Login Instructions

1. Open the website on your phone
2. Registration (First Time Only): Click REGISTER and create a new username/password.
3. Login: Use your new credentials.

Done! You are logged in.

---

## 📸 Screenshots (Soon..)

- Login screen  A
- Chat interface  
- DM list  
- Admin console  
- QR login  

---

## 🤝 Contributing

```text
1. Fork the project
2. Create a feature branch (git checkout -b feature/NewFeature)
3. Commit changes (git commit -m "Add NewFeature")
4. Push to branch (git push origin feature/NewFeature)
5. Open a Pull Request
```

---

## 📝 License
Distributed under the **MIT License**. See `LICENSE` for more information.
