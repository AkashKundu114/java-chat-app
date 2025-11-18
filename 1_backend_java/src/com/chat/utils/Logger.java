package com.chat.utils;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

public class Logger {
    private static final DateTimeFormatter dtf = DateTimeFormatter.ofPattern("HH:mm:ss");

    public static void info(String msg) {
        System.out.println("[" + LocalTime.now().format(dtf) + "] [INFO] " + msg);
    }

    public static void error(String msg) {
        System.err.println("[" + LocalTime.now().format(dtf) + "] [ERROR] " + msg);
    }
}