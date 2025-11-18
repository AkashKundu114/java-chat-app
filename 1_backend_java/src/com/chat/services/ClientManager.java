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
        DatabaseManager.saveMessage(sender, recipient, content);

        ClientWorker worker = activeClients.get(recipient);
        if (worker != null) worker.sendRawMessage("DM:" + sender + ":" + content);
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