package com.benchmark.kafka.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    @Value("${kafka.topics.orders:orders}")
    private String ordersTopic;

    @Value("${kafka.topics.events:events}")
    private String eventsTopic;

    @Value("${kafka.topics.partitions:3}")
    private int partitions;

    @Value("${kafka.topics.replication-factor:2}")
    private short replicationFactor;

    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name(ordersTopic)
                .partitions(partitions)
                .replicas(replicationFactor)
                .build();
    }

    @Bean
    public NewTopic eventsTopic() {
        return TopicBuilder.name(eventsTopic)
                .partitions(partitions)
                .replicas(replicationFactor)
                .build();
    }
}
