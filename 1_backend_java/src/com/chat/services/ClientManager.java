package com.chat.services;

import com.chat.threads.ClientWorker;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.List;

public class ClientManager {
    private static final Map<String, ClientWorker> activeClients = new ConcurrentHashMap<>();

    public static void register(String username, ClientWorker worker) {
        activeClients.put(username, worker);
        broadcastUserList();
    }

    public static void unregister(String username) {
        if (username != null) {
            activeClients.remove(username);
            broadcastUserList();
        }
    }

    public static void sendPrivateMessage(String sender, String recipient, String content) {
        // 1. Save to MongoDB (Permanent Storage)
        DatabaseManager.saveMessage(sender, recipient, content);

        // 2. Deliver Real-time if online
        ClientWorker recipientWorker = activeClients.get(recipient);
        if (recipientWorker != null) {
            recipientWorker.sendRawMessage("DM:" + sender + ":" + content);
        }
    }
    
    // Called when User A clicks on User B to load old chats
    public static void loadHistoryFor(String requestor, String targetUser) {
        ClientWorker worker = activeClients.get(requestor);
        if (worker != null) {
            List<String> history = DatabaseManager.getChatHistory(requestor, targetUser);
            for (String packet : history) {
                worker.sendRawMessage(packet);
            }
        }
    }

    private static void broadcastUserList() {
        StringBuilder sb = new StringBuilder("USERS:");
        List<String> allUsers = DatabaseManager.getAllUsernames();
        
        for (String user : allUsers) {
            boolean isOnline = activeClients.containsKey(user);
            sb.append(user).append(isOnline ? "(Online)" : "(Offline)").append(",");
        }
        
        String listPacket = sb.toString();
        if (listPacket.endsWith(",")) listPacket = listPacket.substring(0, listPacket.length() - 1);

        for (ClientWorker worker : activeClients.values()) {
            worker.sendRawMessage(listPacket);
        }
    }
}