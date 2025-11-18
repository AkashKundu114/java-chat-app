package com.chat.services;

import com.chat.threads.ClientWorker;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

public class ClientManager {
    private static final Set<ClientWorker> activeWorkers = Collections.synchronizedSet(new HashSet<>());

    public static void add(ClientWorker worker) {
        activeWorkers.add(worker);
    }

    public static void remove(ClientWorker worker) {
        activeWorkers.remove(worker);
    }

    public static void broadcast(String message, ClientWorker sender) {
        synchronized (activeWorkers) {
            for (ClientWorker worker : activeWorkers) {
                if (worker != sender) {
                    worker.sendRawMessage(message);
                }
            }
        }
    }
}