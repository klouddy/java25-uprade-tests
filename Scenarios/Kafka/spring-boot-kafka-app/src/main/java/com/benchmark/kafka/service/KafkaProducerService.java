package com.benchmark.kafka.service;

import com.benchmark.kafka.dto.MessageRequest;
import com.benchmark.kafka.dto.MessageResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class KafkaProducerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaProducerService.class);
    
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public CompletableFuture<MessageResponse> sendMessage(MessageRequest request) {
        String messageId = UUID.randomUUID().toString();
        
        logger.info("Sending message {} to topic: {}", messageId, request.getTopic());
        
        CompletableFuture<SendResult<String, Object>> future = 
            kafkaTemplate.send(request.getTopic(), request.getKey(), request.getPayload());
        
        return future.handle((result, ex) -> {
            if (ex != null) {
                logger.error("Failed to send message {} to topic {}: {}", 
                    messageId, request.getTopic(), ex.getMessage());
                return new MessageResponse(
                    messageId,
                    request.getTopic(),
                    request.getKey(),
                    null,
                    null,
                    Instant.now(),
                    "FAILED"
                );
            } else {
                var metadata = result.getRecordMetadata();
                logger.info("Message {} sent successfully to topic {} partition {} offset {}", 
                    messageId, metadata.topic(), metadata.partition(), metadata.offset());
                return new MessageResponse(
                    messageId,
                    metadata.topic(),
                    request.getKey(),
                    metadata.partition(),
                    metadata.offset(),
                    Instant.now(),
                    "SUCCESS"
                );
            }
        });
    }

    public CompletableFuture<MessageResponse> sendMessageToTopic(String topic, String key, Object payload) {
        MessageRequest request = new MessageRequest(topic, key, payload);
        return sendMessage(request);
    }
}
