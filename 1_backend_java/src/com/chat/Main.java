package com.chat;

import com.chat.core.ConnectionListener;
import com.chat.services.DatabaseManager;
import com.chat.services.AuthManager;
import java.net.InetAddress;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("::: JAVA CHAT SERVER (LOCAL DB) :::");
            
            // Connect to Local MongoDB
            DatabaseManager.init();
            
            System.out.println("Host IP: " + InetAddress.getLocalHost().getHostAddress());
            
            // Start Server Thread
            new Thread(() -> new ConnectionListener().start()).start();

            // Admin Loop (Direct Input)
            try (Scanner sc = new Scanner(System.in)) {
                System.out.println("COMMAND: create <username> <password>");
                
                while (true) {
                    String cmd = sc.nextLine();
                    if (cmd.startsWith("create ")) {
                        String[] parts = cmd.split(" ");
                        if (parts.length == 3) {
                            String user = parts[1];
                            String pass = parts[2];
                            if (AuthManager.registerPermanentUser(user, pass)) {
                                System.out.println(">> QR STRING: LOGIN:" + user + ":" + pass);
                            } else {
                                System.out.println("User already exists!");
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}