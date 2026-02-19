package com.benchmark.kafka.dto;

import java.time.Instant;

public class MessageResponse {

    private String messageId;
    private String topic;
    private String key;
    private Integer partition;
    private Long offset;
    private Instant timestamp;
    private String status;

    public MessageResponse() {
    }

    public MessageResponse(String messageId, String topic, String key, Integer partition, 
                          Long offset, Instant timestamp, String status) {
        this.messageId = messageId;
        this.topic = topic;
        this.key = key;
        this.partition = partition;
        this.offset = offset;
        this.timestamp = timestamp;
        this.status = status;
    }

    // Getters and Setters
    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
