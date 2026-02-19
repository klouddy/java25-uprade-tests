package com.benchmark.kafka;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;

@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"orders", "events"})
class KafkaBenchmarkApplicationTests {

    @Test
    void contextLoads() {
        // Test that the application context loads successfully
    }
}
