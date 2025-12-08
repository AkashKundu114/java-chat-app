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
        
        // Trigger DB flush for offline messages on login
        flushOfflineMessages(username);
    }

    public static void unregister(String username) {
        if (username != null) {
            activeClients.remove(username);
            broadcastUserList();
        }
    }

    public static void sendPrivateMessage(String sender, String recipient, String content) {
        ClientWorker worker = activeClients.get(recipient);
        boolean isOnline = (worker != null);

        // 1. Save to DB with 'delivered' status based on online state
        DatabaseManager.saveMessage(sender, recipient, content, isOnline);

        // 2. If online, send immediately
        if (isOnline) {
            worker.sendRawMessage("DM:" + sender + ":" + content);
        } 
        // If offline, we simply do nothing. It's saved in DB as delivered=false.
        // It will be picked up by getAndMarkUnreadMessages next time they login.
    }
    
    // NEW: Pulls unread from DB
    private static void flushOfflineMessages(String username) {
        List<String> pending = DatabaseManager.getAndMarkUnreadMessages(username);
        
        ClientWorker worker = activeClients.get(username);
        if (worker != null && !pending.isEmpty()) {
            for (String msg : pending) {
                worker.sendRawMessage(msg);
            }
        }
    }
    
    public static void loadHistory(String me, String other) {
        ClientWorker worker = activeClients.get(me);
        if(worker == null) return;
        
        List<String> msgs = DatabaseManager.getHistory(me, other);
        for(String m : msgs) worker.sendRawMessage(m);
    }

    private static void broadcastUserList() {
        StringBuilder sb = new StringBuilder("USERS:");
        List<String> all = DatabaseManager.getAllUsers();
        
        for (String u : all) {
            boolean online = activeClients.containsKey(u);
            sb.append(u).append(online ? "(Online)" : "(Offline)").append(",");
        }
        String packet = sb.toString();
        if(packet.endsWith(",")) packet = packet.substring(0, packet.length()-1);
        
        for(ClientWorker w : activeClients.values()) w.sendRawMessage(packet);
    }
}