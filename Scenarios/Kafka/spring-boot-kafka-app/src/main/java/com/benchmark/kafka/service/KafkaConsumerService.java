package com.benchmark.kafka.service;

import com.benchmark.kafka.dto.ConsumedMessage;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedQueue;

@Service
public class KafkaConsumerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);
    private static final int MAX_STORED_MESSAGES = 100;
    
    private final ConcurrentLinkedQueue<ConsumedMessage> consumedMessages = new ConcurrentLinkedQueue<>();

    @KafkaListener(topics = "${kafka.topics.orders:orders}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeOrders(ConsumerRecord<String, Object> record) {
        processMessage(record);
    }

    @KafkaListener(topics = "${kafka.topics.events:events}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeEvents(ConsumerRecord<String, Object> record) {
        processMessage(record);
    }

    private void processMessage(ConsumerRecord<String, Object> record) {
        logger.info("Consumed message from topic: {}, partition: {}, offset: {}, key: {}", 
            record.topic(), record.partition(), record.offset(), record.key());
        
        ConsumedMessage message = new ConsumedMessage(
            record.topic(),
            record.key(),
            record.value(),
            record.partition(),
            record.offset(),
            Instant.ofEpochMilli(record.timestamp())
        );
        
        // Store message with size limit
        consumedMessages.offer(message);
        while (consumedMessages.size() > MAX_STORED_MESSAGES) {
            consumedMessages.poll();
        }
    }

    public List<ConsumedMessage> getConsumedMessages() {
        return new ArrayList<>(consumedMessages);
    }

    public List<ConsumedMessage> getConsumedMessages(int limit) {
        List<ConsumedMessage> messages = new ArrayList<>(consumedMessages);
        Collections.reverse(messages);
        return messages.stream().limit(limit).toList();
    }

    public void clearConsumedMessages() {
        consumedMessages.clear();
        logger.info("Cleared all consumed messages");
    }
}
