package com.chat.core;

import com.chat.config.ServerConfig;
import com.chat.services.ClientManager;
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
                
                // Create new thread for client (Inheritance)
                ClientWorker worker = new ClientWorker(clientSocket);
                
                // Add to active list
                ClientManager.add(worker);
                
                // Start the thread
                worker.start();
            }
            
        } catch (IOException e) {
            Logger.error("Server error: " + e.getMessage());
        }
    }
}