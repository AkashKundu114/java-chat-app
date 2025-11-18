Enterprise Chat Application 🚀

A fully functional, multi-threaded chat application featuring a Java Backend, Node.js Bridge, and a Responsive Web Client with QR Code authentication. Designed to demonstrate raw TCP socket handling, threading, and secure websocket tunneling.

🌟 Key Features

Multi-Threaded Java Core: Uses the Thread Inheritance model to handle multiple concurrent users without blocking.

Direct Messaging (DM): Supports private 1-on-1 messaging routed by the server.

Offline Message Storage: Saves messages for users who are offline and delivers them upon reconnection.

Hybrid Architecture: Bridges raw TCP Java sockets to Modern WebSockets for browser compatibility.

Secure QR Login: Admin-generated tokens and QR scanning for secure, password-less entry.

Responsive UI: Mobile-first web interface styled with Tailwind CSS.

📂 Architecture Overview

The project is divided into three distinct modules:

1_backend_java (The Brain):

Manages client connections, threading, message routing, and storage.

Runs on Port 12345.

2_bridge_node (The Translator):

Converts Browser WebSockets (ws://) to Raw TCP Sockets.

Runs on Port 8080.

3_client_web (The Face):

A pure HTML/JS frontend that users interact with.

Connects via Ngrok or Localhost.

🛠 Prerequisites

Java JDK 17+

Node.js (LTS Version)

Git

🚀 Quick Start Guide

1. Clone the Repository

git clone [https://github.com/AkashKundu114/java-chat-app.git](https://github.com/AkashKundu114/java-chat-app.git)
cd java-chat-app


2. Start the Java Backend (Terminal 1)

This handles the core logic.

cd 1_backend_java
mkdir -p bin
# Compile
javac -d bin src/com/chat/Main.java src/com/chat/services/*.java src/com/chat/threads/*.java src/com/chat/core/*.java src/com/chat/config/*.java src/com/chat/constants/*.java src/com/chat/models/*.java src/com/chat/utils/*.java
# Run
java -cp bin com.chat.Main


While here, create a user by typing: register Akash (Copy the generated Token!)

3. Start the Bridge (Terminal 2)

This allows the web browser to talk to Java.

cd 2_bridge_node
npm install
npm start


4. Expose to Internet (Terminal 3 - Optional)

Use Ngrok to allow phones to connect securely.

ngrok http 8080


Copy the Forwarding URL (e.g., https://xyz.ngrok-free.app).

5. Launch the App

Host: Drag the 3_client_web folder to Netlify Drop or serve locally (python -m http.server 8000).

Connect: Open the site on your phone.

Configure: Enter the Ngrok URL in the "Bridge IP" box.

Login: Open 3_client_web/admin.html on PC, paste your token, generate QR, and scan with phone.

📸 Screenshots

Login Screen

Chat Interface

Admin Console

Scan QR to Enter

Private DMs & Sidebar

Token Generation

🤝 Contributing

Fork the Project

Create your Feature Branch (git checkout -b feature/AmazingFeature)

Commit your Changes (git commit -m 'Add some AmazingFeature')

Push to the Branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License

Distributed under the MIT License. See LICENSE for more information.