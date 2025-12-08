package com.chat.services;

import com.chat.config.ServerConfig;
import com.chat.utils.Logger;
import com.chat.utils.PasswordHasher;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.bson.conversions.Bson;
import java.util.ArrayList;
import java.util.List;

public class DatabaseManager {
    private static MongoClient mongoClient;
    private static MongoDatabase database;

    public static void init() {
        try {
            Logger.info("Connecting to MongoDB...");
            mongoClient = new MongoClient(new MongoClientURI(ServerConfig.MONGO_URI));
            database = mongoClient.getDatabase(ServerConfig.DB_NAME);
            Logger.info("MongoDB Connected Successfully!");
        } catch (Exception e) {
            Logger.error("DB Error: " + e.getMessage());
        }
    }

    // --- USER MANAGEMENT ---

    public static boolean createUser(String username, String password) {
        MongoCollection<Document> users = database.getCollection("users");
        if (users.find(Filters.eq("_id", username)).first() != null) return false;
    
        String hashedPassword = PasswordHasher.hash(password);
        
        Document doc = new Document("_id", username)
                .append("password", hashedPassword)
                .append("created_at", System.currentTimeMillis());
        users.insertOne(doc);
        return true;
    }

    public static boolean verifyUser(String username, String password) {
        MongoCollection<Document> users = database.getCollection("users");
        Document user = users.find(Filters.eq("_id", username)).first();
        if (user == null) return false;
        
        String storedHash = user.getString("password");
        return PasswordHasher.verify(password, storedHash); 
    }

    public static List<String> getAllUsers() {
        List<String> list = new ArrayList<>();
        for(Document d : database.getCollection("users").find()) list.add(d.getString("_id"));
        return list;
    }

    // --- MESSAGE MANAGEMENT (PER-USER DB PATTERN) ---

    public static void saveMessage(String from, String to, String text, boolean isDelivered) {
        long ts = System.currentTimeMillis();

        // 1. Save to SENDER'S Box (History)
        // We assume sent messages are always 'delivered' to the sender's own history
        Document senderCopy = new Document("contact", to) // The other person
                .append("sender", from)
                .append("text", text)
                .append("type", "sent")
                .append("ts", ts);
        
        database.getCollection("box_" + from).insertOne(senderCopy);

        // 2. Save to RECIPIENT'S Box (Inbox)
        Document recipientCopy = new Document("contact", from) // The other person
                .append("sender", from)
                .append("text", text)
                .append("type", "received")
                .append("ts", ts)
                .append("delivered", isDelivered); // Only recipient cares if it was delivered live
        
        database.getCollection("box_" + to).insertOne(recipientCopy);
    }

    public static List<String> getHistory(String owner, String otherPerson) {
        List<String> history = new ArrayList<>();
        try {
            // We only need to query the 'owner's' box.
            // This is efficient: No complex OR queries across a massive global table.
            MongoCollection<Document> box = database.getCollection("box_" + owner);
            
            Bson filter = Filters.eq("contact", otherPerson);
            
            for (Document d : box.find(filter).sort(new Document("ts", 1))) {
                // Reconstruct format: DM:sender:content
                history.add("DM:" + d.getString("sender") + ":" + d.getString("text"));
            }
        } catch (Exception e) {
            Logger.error("Error fetching history: " + e.getMessage());
        }
        return history;
    }

    public static List<String> getAndMarkUnreadMessages(String username) {
        List<String> pendingMessages = new ArrayList<>();
        try {
            MongoCollection<Document> box = database.getCollection("box_" + username);
            
            // Find messages in My Box where type='received' AND delivered=false
            Bson filter = Filters.and(
                Filters.eq("type", "received"), 
                Filters.eq("delivered", false)
            );
            
            for (Document d : box.find(filter)) {
                pendingMessages.add("DM:" + d.getString("sender") + ":" + d.getString("text"));
            }
            
            // Mark them as delivered so they don't pop up again next login
            if (!pendingMessages.isEmpty()) {
                box.updateMany(filter, Updates.set("delivered", true));
                Logger.info("Flushed " + pendingMessages.size() + " offline messages to " + username);
            }
        } catch (Exception e) {
            Logger.error("Error flushing offline messages: " + e.getMessage());
        }
        return pendingMessages;
    }
}