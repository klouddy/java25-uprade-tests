package com.benchmark.kafka.controller;

import com.benchmark.kafka.dto.ConsumedMessage;
import com.benchmark.kafka.dto.MessageRequest;
import com.benchmark.kafka.dto.MessageResponse;
import com.benchmark.kafka.service.KafkaConsumerService;
import com.benchmark.kafka.service.KafkaProducerService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final KafkaProducerService producerService;
    private final KafkaConsumerService consumerService;

    public MessageController(KafkaProducerService producerService, 
                            KafkaConsumerService consumerService) {
        this.producerService = producerService;
        this.consumerService = consumerService;
    }

    @PostMapping
    public CompletableFuture<ResponseEntity<MessageResponse>> sendMessage(
            @Valid @RequestBody MessageRequest request) {
        return producerService.sendMessage(request)
            .thenApply(response -> ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response));
    }

    @PostMapping("/topic/{topic}")
    public CompletableFuture<ResponseEntity<MessageResponse>> sendMessageToTopic(
            @PathVariable String topic,
            @RequestParam String key,
            @RequestBody Object payload) {
        return producerService.sendMessageToTopic(topic, key, payload)
            .thenApply(response -> ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response));
    }

    @GetMapping("/consumed")
    public ResponseEntity<List<ConsumedMessage>> getConsumedMessages(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(consumerService.getConsumedMessages(limit));
    }

    @DeleteMapping("/consumed")
    public ResponseEntity<Void> clearConsumedMessages() {
        consumerService.clearConsumedMessages();
        return ResponseEntity.noContent().build();
    }
}
