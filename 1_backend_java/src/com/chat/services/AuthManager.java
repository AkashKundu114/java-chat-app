package com.chat.services;

public class AuthManager {
    
    public static boolean registerPermanentUser(String username, String password) {
        return DatabaseManager.createUser(username, password);
    }

    public static boolean verifyLogin(String username, String password) {
        return DatabaseManager.verifyUser(username, password);
    }
}