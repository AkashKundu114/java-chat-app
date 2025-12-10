package com.chat.threads;

import com.chat.services.ClientManager;
import com.chat.services.AuthManager;
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

            String line;
            while ((line = in.readLine()) != null) {
                if (line.startsWith("TO:")) {
                    String[] p = line.split(":", 3);
                    if (p.length == 3) {
                        String recipient = p[1];
                        String content = p[2];
                        
                        if (content.startsWith("$$FILE$$")) {
                            Logger.info("File transfer: " + username + " -> " + recipient);
                        }
                        
                        ClientManager.sendPrivateMessage(username, recipient, content);
                    }
                }
                if (line.startsWith("HISTORY:")) {
                    String target = line.split(":")[1];
                    ClientManager.loadHistory(username, target);
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
        
        if (line != null && line.startsWith("AUTH:")) {
            String[] parts = line.split(":");
            if (parts.length == 4) {
                String type = parts[1];
                String user = parts[2];
                String pass = parts[3];
                
                boolean isAuthenticated = false;
                
                if (type.equals("REGISTER")) {
                    isAuthenticated = AuthManager.registerPermanentUser(user, pass);
                    if (isAuthenticated) Logger.info("New user registered: " + user);
                }
                
                if (type.equals("LOGIN") || isAuthenticated) {
                    isAuthenticated = AuthManager.verifyLogin(user, pass);
                }
                
                if (isAuthenticated) {
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