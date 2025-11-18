package com.chat.services;

import com.chat.utils.Logger;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class AuthManager {
    
    private static final Map<String, String> validTokens = new ConcurrentHashMap<>();

    public static String registerUser(String username) {
        String token = UUID.randomUUID().toString();
        validTokens.put(token, username);
        Logger.info("REGISTERED USER: " + username + " | TOKEN: " + token);
        return token;
    }

    public static String validate(String token) {
        return validTokens.get(token); 
    }
}