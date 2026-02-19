package com.benchmark.kafka.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public class MessageRequest {

    @NotBlank(message = "Topic is required")
    private String topic;

    @NotBlank(message = "Key is required")
    private String key;

    @NotNull(message = "Payload is required")
    private Object payload;

    private Instant timestamp;

    public MessageRequest() {
        this.timestamp = Instant.now();
    }

    public MessageRequest(String topic, String key, Object payload) {
        this.topic = topic;
        this.key = key;
        this.payload = payload;
        this.timestamp = Instant.now();
    }

    // Getters and Setters
    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
