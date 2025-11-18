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
                    if (p.length == 3) ClientManager.sendPrivateMessage(username, p[1], p[2]);
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
        if (line != null && line.startsWith("AUTH:LOGIN:")) {
            String[] p = line.split(":");
            if (p.length == 4) {
                if (AuthManager.verifyLogin(p[2], p[3])) {
                    this.username = p[2];
                    out.println("AUTH_SUCCESS:" + username);
                    return true;
                }
            }
        }
        out.println(Messages.AUTH_FAIL);
        return false;
    }
    public void sendRawMessage(String msg) { if (out != null) out.println(msg); }
}