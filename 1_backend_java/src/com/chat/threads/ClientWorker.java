package com.chat.threads;

import com.chat.services.ClientManager;
import com.chat.services.AuthManager;
import com.chat.services.DatabaseManager; // Import DB
import com.chat.constants.Messages;
import com.chat.utils.Logger;
import java.io.*;
import java.net.Socket;

public class ClientWorker extends Thread {
    private final Socket socket;
    private PrintWriter out;
    private BufferedReader in;
    private String username;

    public ClientWorker(Socket socket) { this.socket = socket; }

    @Override
    public void run() {
        try {
            out = new PrintWriter(socket.getOutputStream(), true);
            in = new BufferedReader(new InputStreamReader(socket.getInputStream()));

            if (!authenticate()) { socket.close(); return; }
            
            ClientManager.register(username, this);

            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                
                // 1. Send DM
                if (inputLine.startsWith("TO:")) {
                    String[] parts = inputLine.split(":", 3);
                    if (parts.length == 3) {
                        ClientManager.sendPrivateMessage(username, parts[1], parts[2]);
                    }
                }
                
                // 2. Request History (Client asks for chats with specific person)
                if (inputLine.startsWith("HISTORY:")) {
                    String target = inputLine.split(":")[1];
                    ClientManager.loadHistoryFor(username, target);
                }
            }
        } catch (IOException e) {
            Logger.error("Client dropped: " + username);
        } finally {
            ClientManager.unregister(username);
            try { socket.close(); } catch (IOException e) {}
        }
    }

    private boolean authenticate() throws IOException {
        out.println(Messages.AUTH_REQ);
        String line = in.readLine();
        
        // Expecting: AUTH:LOGIN:username:password
        if (line != null && line.startsWith("AUTH:LOGIN:")) {
            String[] parts = line.split(":");
            // parts[0]=AUTH, parts[1]=LOGIN, parts[2]=user, parts[3]=pass
            if (parts.length == 4) {
                String user = parts[2];
                String pass = parts[3];
                
                if (AuthManager.verifyLogin(user, pass)) {
                    this.username = user;
                    out.println("AUTH_SUCCESS:" + user);
                    return true;
                }
            }
        }
        out.println(Messages.AUTH_FAIL);
        return false;
    }

    public void sendRawMessage(String msg) { if (out != null) out.println(msg); }
}