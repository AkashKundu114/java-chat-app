package com.chat.services;

import com.chat.models.Message;
import com.chat.threads.ClientWorker;
import com.chat.utils.Logger;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.List;

public class ClientManager {
    private static final Map<String, ClientWorker> activeClients = new ConcurrentHashMap<>();

    public static void register(String username, ClientWorker worker) {
        activeClients.put(username, worker);
        broadcastUserList();
        
        List<Message> pending = StorageManager.getPendingMessages(username);
        if (pending != null) {
            for (Message m : pending) {
                worker.sendRawMessage("DM:" + m.getFrom() + ":" + m.getContent());
            }
        }
    }

    public static void unregister(String username) {
        if (username != null) {
            activeClients.remove(username);
            broadcastUserList();
        }
    }

    public static void sendPrivateMessage(String sender, String recipient, String content) {
        ClientWorker recipientWorker = activeClients.get(recipient);
        Message msg = new Message(sender, recipient, content);

        if (recipientWorker != null) {
            recipientWorker.sendRawMessage("DM:" + sender + ":" + content);
        } else {
            StorageManager.saveMessage(recipient, msg);
        }
    }

    private static void broadcastUserList() {
        StringBuilder sb = new StringBuilder("USERS:");
        
        for (String user : activeClients.keySet()) {
            sb.append(user).append("(Online)").append(",");
        }
        
        String listPacket = sb.toString();
        if (listPacket.endsWith(",")) listPacket = listPacket.substring(0, listPacket.length() - 1);

        for (ClientWorker worker : activeClients.values()) {
            worker.sendRawMessage(listPacket);
        }
    }
}