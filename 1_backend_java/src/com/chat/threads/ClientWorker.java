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

            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                Logger.info("MSG from " + username + ": " + inputLine);
                ClientManager.broadcast("[" + username + "]: " + inputLine, this);
            }
        } catch (IOException e) {
            Logger.error("Client dropped.");
        } finally {
            try { socket.close(); } catch (IOException e) {}
            ClientManager.remove(this);
        }
    }

    private boolean authenticate() throws IOException {
        out.println(Messages.AUTH_REQ);
        String line = in.readLine();
        if (line != null && line.startsWith("AUTH:")) {
            String token = line.substring(5).trim();
            String user = AuthManager.validate(token);
            if (user != null) {
                this.username = user;
                out.println("AUTH_SUCCESS:" + user);
                Logger.info(user + " logged in.");
                return true;
            }
        }
        out.println(Messages.AUTH_FAIL);
        return false;
    }

    public void sendRawMessage(String msg) { if (out != null) out.println(msg); }
}
