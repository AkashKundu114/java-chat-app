package com.chat.utils;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

public class PasswordHasher {

    /**
     * Hashes a plain text password using SHA-256.
     * @param password The plaintext password.
     * @return The Base64 encoded hash string.
     */
    public static String hash(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(password.getBytes());
            // Return hash as Base64 string for easy database storage
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            // This should never happen with SHA-256
            Logger.error("SHA-256 algorithm not found: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }

    /**
     * Verifies a plain text password against a stored hash.
     * @param plaintextPassword The password provided by the user (e.g., during login).
     * @param storedHash The hash stored in the MongoDB database.
     * @return true if the hashes match, false otherwise.
     */
    public static boolean verify(String plaintextPassword, String storedHash) {
        String inputHash = hash(plaintextPassword);
        return inputHash.equals(storedHash);
    }
}