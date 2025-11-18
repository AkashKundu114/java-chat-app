package com.chat.services;

import com.chat.config.ServerConfig;
import com.chat.utils.Logger;

import com.mongodb.MongoClient;
import com.mongodb.MongoClientURI;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.FindIterable;
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
            Logger.info("MongoDB Connected Successfully!");
        } catch (Exception e) {
            Logger.error("DB Error: " + e.getMessage());
        }
    }

    // --- USERS ---
    public static boolean createUser(String username, String password) {
        MongoCollection<Document> users = database.getCollection("users");

        if (users.find(Filters.eq("_id", username)).first() != null)
            return false;

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

        return password.equals(user.getString("password"));
    }

    public static List<String> getAllUsers() {
        List<String> list = new ArrayList<>();
        for (Document d : database.getCollection("users").find())
            list.add(d.getString("_id"));
        return list;
    }

    // --- MESSAGES ---
    public static void saveMessage(String from, String to, String text) {
        Document doc = new Document("from", from)
                .append("to", to)
                .append("text", text)
                .append("ts", System.currentTimeMillis());

        database.getCollection("messages").insertOne(doc);
    }

    public static List<String> getHistory(String u1, String u2) {
        List<String> history = new ArrayList<>();

        FindIterable<Document> docs = database.getCollection("messages")
                .find(Filters.or(
                        Filters.and(Filters.eq("from", u1), Filters.eq("to", u2)),
                        Filters.and(Filters.eq("from", u2), Filters.eq("to", u1))
                ))
                .sort(new Document("ts", 1));

        for (Document d : docs) {
            history.add("DM:" + d.getString("from") + ":" + d.getString("text"));
        }
        return history;
    }
}
