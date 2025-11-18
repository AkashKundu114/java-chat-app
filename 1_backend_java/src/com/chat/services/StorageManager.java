package com.chat.services;

import com.chat.models.Message;
import com.chat.utils.Logger;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class StorageManager {
    private static final Map<String, List<Message>> offlineMessages = new ConcurrentHashMap<>();

    public static void saveMessage(String recipient, Message msg) {
        offlineMessages.computeIfAbsent(recipient, k -> new ArrayList<>()).add(msg);
        Logger.info("Saved offline message for: " + recipient);
    }

    public static List<Message> getPendingMessages(String user) {
        return offlineMessages.remove(user); 
    }
}