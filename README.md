# 🚀 Enterprise Chat Application  
A full-stack, multi-threaded chat system built with **Java (TCP Sockets)**, **Node.js (WebSocket Bridge)**, and a **Responsive Web Client**.  
Designed to demonstrate **concurrency**, **raw networking**, **offline message delivery**, and **QR-based secure authentication**.

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

### 🔹 QR Code Login (Password-less)  
- Admin generates secure login tokens  
- Users scan QR from mobile to authenticate  

### 🔹 Responsive Web UI  
- Mobile-first  
- Powered by **Tailwind CSS**  
- DM sidebar, chat window, and admin console  

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
- **Node.js (LTS)**  
- **Git**  
- Optional: **Ngrok** for public access  

---

## 🚀 Quick Start

### ⬇️ Clone Repository
```bash
git clone https://github.com/AkashKundu114/java-chat-app.git
cd java-chat-app
```

---

## 1️⃣ Start Java Backend (Terminal 1)
```bash
cd 1_backend_java
mkdir -p bin
```
