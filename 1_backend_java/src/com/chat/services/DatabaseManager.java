package com.chat.services;

public package com.chat.services;

import com.chat.config.ServerConfig;
import com.chat.models.Message;
import com.chat.utils.Logger;
import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.Filters;
import org.bson.Document;

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
            Logger.info("MongoDB Connected!");
        } catch (Exception e) {
            Logger.error("MongoDB Connection Failed: " + e.getMessage());
            System.exit(1);
        }
    }

    // --- USER MANAGEMENT ---
    public static boolean createUser(String username, String password) {
        MongoCollection<Document> users = database.getCollection("users");
        if (users.find(Filters.eq("_id", username)).first() != null) {
            return false; // User exists
        }
        Document doc = new Document("_id", username)
                .append("password", password)
                .append("created_at", System.currentTimeMillis());
        users.insertOne(doc);
        return true;
    }

    public static boolean verifyUser(String username, String password) {
        MongoCollection<Document> users = database.getCollection("users");
        Document user = users.find(Filters.eq("_id", username)).first();
        if (user == null) return false;
        return user.getString("password").equals(password);
    }

    // --- MESSAGE HISTORY ---
    public static void saveMessage(String sender, String recipient, String content) {
        MongoCollection<Document> msgs = database.getCollection("messages");
        Document doc = new Document("sender", sender)
                .append("recipient", recipient)
                .append("content", content)
                .append("timestamp", System.currentTimeMillis());
        msgs.insertOne(doc);
    }

    public static List<String> getChatHistory(String user1, String user2) {
        MongoCollection<Document> msgs = database.getCollection("messages");
        List<String> history = new ArrayList<>();
        
        // Find messages between user1 and user2 (in either direction)
        for (Document doc : msgs.find(Filters.or(
                Filters.and(Filters.eq("sender", user1), Filters.eq("recipient", user2)),
                Filters.and(Filters.eq("sender", user2), Filters.eq("recipient", user1))
        )).sort(new Document("timestamp", 1))) { // Oldest first
            
            history.add("DM:" + doc.getString("sender") + ":" + doc.getString("content"));
        }
        return history;
    }
    
    // Fetch list of all registered users for the sidebar
    public static List<String> getAllUsernames() {
        List<String> list = new ArrayList<>();
        for (Document doc : database.getCollection("users").find()) {
            list.add(doc.getString("_id"));
        }
        return list;
    }
} {
    
}
