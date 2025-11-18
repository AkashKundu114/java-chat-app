package com.chat;
import com.chat.core.ConnectionListener;
import com.chat.services.AuthManager;
import java.net.InetAddress;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        try {
            System.out.println("::: JAVA CHAT ADMIN CONSOLE :::");
            System.out.println("Host IP: " + InetAddress.getLocalHost().getHostAddress());
            
            new Thread(() -> new ConnectionListener().start()).start();

            try (Scanner scanner = new Scanner(System.in)) {
                System.out.println("Type 'register <username>' to generate a QR Token.");
                
                while (true) {
                    String cmd = scanner.nextLine();
                    if (cmd.startsWith("register ")) {
                        String token = AuthManager.registerUser(cmd.split(" ")[1]);
                        System.out.println(">> TOKEN: " + token);
                    }
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
    }
}
