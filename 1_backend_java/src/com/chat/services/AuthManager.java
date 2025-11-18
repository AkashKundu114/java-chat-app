package com.chat.services;

import com.chat.utils.Logger;

public class AuthManager {
    
    // Registers a PERMANENT user in MongoDB
    public static boolean registerPermanentUser(String username, String password) {
        boolean success = DatabaseManager.createUser(username, password);
        if (success) {
            Logger.info("DB: Created User " + username);
        } else {
            Logger.error("DB: User " + username + " already exists!");
        }
        return success;
    }

    // Verifies credentials from the QR code (LOGIN:user:pass)
    public static boolean verifyLogin(String username, String password) {
        return DatabaseManager.verifyUser(username, password);
    }
}