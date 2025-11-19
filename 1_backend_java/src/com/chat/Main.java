package com.chat;

import com.chat.core.ConnectionListener;
import com.chat.services.DatabaseManager;
import com.chat.services.AuthManager;
import com.chat.utils.Logger;
import java.net.InetAddress;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("::: JAVA CHAT SERVER (DB) :::");
            
            DatabaseManager.init(); // Connect to MongoDB
            
            System.out.println("Host IP: " + InetAddress.getLocalHost().getHostAddress());
            
            new Thread(() -> new ConnectionListener().start()).start();

            try (Scanner sc = new Scanner(System.in)) {
                System.out.println("ADMIN CMD: create <user> <pass> (For quick manual creation)");
                
                while (true) {
                    if (!sc.hasNextLine()) break;
                    String cmd = sc.nextLine();
                    if (cmd.startsWith("create ")) {
                        String[] p = cmd.split(" ");
                        if (p.length == 3) {
                            if (AuthManager.registerPermanentUser(p[1], p[2])) {
                                Logger.info("ADMIN: Manually created user " + p[1]);
                            } else {
                                Logger.error("ADMIN: User " + p[1] + " already exists.");
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