package com.chat.core;

import com.chat.config.ServerConfig;
import com.chat.threads.ClientWorker;
import com.chat.utils.Logger;
import java.io.IOException;
import java.net.*;

public class ConnectionListener {
    
    public void start() {
        try (ServerSocket server = new ServerSocket(ServerConfig.PORT, 50, InetAddress.getByName(ServerConfig.BIND_ADDRESS))) {
            
            Logger.info("Server running on Port " + ServerConfig.PORT);
            
            while (true) {
                Socket clientSocket = server.accept();
                
                ClientWorker worker = new ClientWorker(clientSocket);

                worker.start();
            }
            
        } catch (IOException e) {
            Logger.error("Server error: " + e.getMessage());
        }
    }
}