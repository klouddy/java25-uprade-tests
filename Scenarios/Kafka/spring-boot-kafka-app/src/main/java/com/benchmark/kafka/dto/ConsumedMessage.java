package com.benchmark.kafka.dto;

import java.time.Instant;

public class ConsumedMessage {

    private String topic;
    private String key;
    private Object payload;
    private Integer partition;
    private Long offset;
    private Instant timestamp;

    public ConsumedMessage() {
    }

    public ConsumedMessage(String topic, String key, Object payload, Integer partition, 
                          Long offset, Instant timestamp) {
        this.topic = topic;
        this.key = key;
        this.payload = payload;
        this.partition = partition;
        this.offset = offset;
        this.timestamp = timestamp;
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

    public Integer getPartition() {
        return partition;
    }

    public void setPartition(Integer partition) {
        this.partition = partition;
    }

    public Long getOffset() {
        return offset;
    }

    public void setOffset(Long offset) {
        this.offset = offset;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
