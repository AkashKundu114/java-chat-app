package com.chat.services;

public class AuthManager {
    
    // Registers a PERMANENT user in MongoDB (calls DB manager which handles hashing)
    public static boolean registerPermanentUser(String username, String password) {
        return DatabaseManager.createUser(username, password);
    }

    // Verifies credentials from the login screen (calls DB manager which handles verification)
    public static boolean verifyLogin(String username, String password) {
        return DatabaseManager.verifyUser(username, password);
    }
}