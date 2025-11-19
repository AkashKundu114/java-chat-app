package com.chat.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class PasswordHasher {

    /**
     * Hashes a plain text password using SHA-256.
     */
    public static String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(password.getBytes());
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            Logger.error("SHA-256 algorithm not found: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * Verifies a plain text password against a stored hash.
     */
    public static boolean verify(String plaintextPassword, String storedHash) {
        String inputHash = hash(plaintextPassword);
        return inputHash.equals(storedHash);
    }
}