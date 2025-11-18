package com.chat.models;

import java.io.Serializable;

public class Message implements Serializable {
    private String from;
    private String to;
    private String content;
    private long timestamp;

    public Message(String from, String to, String content) {
        this.from = from;
        this.to = to;
        this.content = content;
        this.timestamp = System.currentTimeMillis();
    }

    public String getFrom() { return from; }
    public String getTo() { return to; }
    public String getContent() { return content; }
    public long getTimestamp() { return timestamp; }
    
    @Override
    public String toString() {
        return "MSG:" + from + ":" + content;
    }
}