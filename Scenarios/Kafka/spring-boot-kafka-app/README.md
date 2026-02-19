# Spring Boot Kafka Benchmark Application

A Spring Boot 3.5.10 application integrated with Apache Kafka for benchmarking Java 17, 21, and 25 performance on AWS ECS Fargate with Amazon MSK (Managed Streaming for Apache Kafka).

## 📋 Overview

This application provides:
- **Kafka Producer**: REST API for sending messages to Kafka topics
- **Kafka Consumer**: Automatic consumption and processing of messages
- **Message Management**: View consumed messages and clear message history
- **Metrics**: Comprehensive JVM, GC, and application metrics via Micrometer
- **Multi-version**: Support for Java 17, 21, and 25
- **Production-ready**: Optimized for load testing and benchmarking with MSK

## 🏗️ Architecture

- **Spring Boot**: 3.5.10
- **Spring Kafka**: For Kafka integration
- **Kafka Topics**: `orders` and `events` (configurable)
- **Consumer Groups**: Configurable concurrency and batch processing
- **Producer**: Idempotent with compression and batching
- **Metrics**: Prometheus endpoint for monitoring

## 🚀 Quick Start

### Prerequisites

- Java 17 or higher
- Maven 3.9+
- Docker and Docker Compose (for local development)

### Local Development with Docker Compose

The easiest way to run the application locally is with Docker Compose, which includes Kafka and Zookeeper:

```bash
# Build and run with Java 17 (default)
docker-compose up

# Or specify Java version
docker-compose -f docker-compose-java17.yml up
docker-compose -f docker-compose-java21.yml up
docker-compose -f docker-compose-java25.yml up
```

The application will be available at `http://localhost:8080`

### Running Locally with External Kafka

If you have Kafka running separately:

```bash
# Build the application
./mvnw clean package

# Run with local profile
java -jar target/spring-boot-kafka-benchmark-1.0.0.jar --spring.profiles.active=local
```

## 📡 API Endpoints

### Message Operations

#### Send Message
```bash
POST /messages
Content-Type: application/json

{
  "topic": "orders",
  "key": "order-123",
  "payload": {
    "orderId": "123",
    "customerId": "456",
    "amount": 99.99
  }
}
```

#### Send Message to Specific Topic
```bash
POST /messages/topic/{topic}?key={key}
Content-Type: application/json

{
  "orderId": "123",
  "customerId": "456",
  "amount": 99.99
}
```

#### Get Consumed Messages
```bash
GET /messages/consumed?limit=10
```

#### Clear Consumed Messages
```bash
DELETE /messages/consumed
```

### Actuator Endpoints

- `GET /actuator/health` - Health check
- `GET /actuator/metrics` - Metrics endpoint
- `GET /actuator/prometheus` - Prometheus metrics

## ⚙️ Configuration

### Environment Variables

#### Kafka Configuration
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker addresses (default: `localhost:9092`)
- `KAFKA_CONSUMER_GROUP_ID` - Consumer group ID (default: `kafka-benchmark-group`)
- `KAFKA_TOPIC_ORDERS` - Orders topic name (default: `orders`)
- `KAFKA_TOPIC_EVENTS` - Events topic name (default: `events`)
- `KAFKA_PARTITIONS` - Number of partitions per topic (default: `3`)
- `KAFKA_REPLICATION_FACTOR` - Replication factor (default: `2`)
- `KAFKA_LISTENER_CONCURRENCY` - Consumer concurrency (default: `3`)

#### Producer Configuration
- `KAFKA_PRODUCER_ACKS` - Acknowledgment mode (default: `all`)
- `KAFKA_PRODUCER_RETRIES` - Number of retries (default: `3`)
- `KAFKA_COMPRESSION_TYPE` - Compression type (default: `snappy`)

#### Consumer Configuration
- `KAFKA_AUTO_OFFSET_RESET` - Offset reset strategy (default: `earliest`)
- `KAFKA_MAX_POLL_RECORDS` - Max records per poll (default: `500`)

#### AWS MSK Configuration (ECS Profile)
- `KAFKA_SECURITY_PROTOCOL` - Security protocol (default: `SASL_SSL`)
- `KAFKA_SASL_MECHANISM` - SASL mechanism (default: `AWS_MSK_IAM`)

#### Server Configuration
- `SERVER_PORT` - Server port (default: `8080`)
- `TOMCAT_MAX_THREADS` - Max Tomcat threads (default: `200`)

### Profiles

- `local` - For local development with minimal replication
- `ecs` - For AWS ECS deployment with MSK IAM authentication

## 🐳 Docker Images

Build Docker images for different Java versions:

```bash
# Java 17
docker build -f Dockerfile.java17 -t kafka-benchmark:java17 .

# Java 21
docker build -f Dockerfile.java21 -t kafka-benchmark:java21 .

# Java 25
docker build -f Dockerfile.java25 -t kafka-benchmark:java25 .
```

## 🧪 Testing

Run the test suite:

```bash
./mvnw test
```

The tests use embedded Kafka for integration testing.

## 📊 Monitoring

The application exposes Prometheus metrics at `/actuator/prometheus` for monitoring:

- HTTP request metrics
- Kafka producer metrics
- Kafka consumer metrics
- JVM metrics (memory, GC, threads)
- Custom application metrics

## 🔐 AWS MSK IAM Authentication

For production deployment with AWS MSK, the application supports IAM authentication:

1. Ensure your ECS task role has permissions for MSK
2. Set `SPRING_PROFILES_ACTIVE=ecs`
3. Configure `KAFKA_BOOTSTRAP_SERVERS` with your MSK endpoint

Required IAM permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "kafka-cluster:Connect",
        "kafka-cluster:DescribeGroup",
        "kafka-cluster:AlterGroup",
        "kafka-cluster:DescribeTopic",
        "kafka-cluster:ReadData",
        "kafka-cluster:WriteData"
      ],
      "Resource": "*"
    }
  ]
}
```

## 📈 Performance Tuning

Key configurations for performance:

1. **Producer**: Enabled idempotence, compression (snappy), and batching
2. **Consumer**: Batch acknowledgment with configurable concurrency
3. **Tomcat**: Optimized thread pool and connection settings
4. **JVM**: Uses G1GC with appropriate heap settings

## 🔧 Development

### Project Structure

```
spring-boot-kafka-app/
├── src/
│   ├── main/
│   │   ├── java/com/benchmark/kafka/
│   │   │   ├── KafkaBenchmarkApplication.java
│   │   │   ├── config/
│   │   │   │   └── KafkaTopicConfig.java
│   │   │   ├── controller/
│   │   │   │   └── MessageController.java
│   │   │   ├── dto/
│   │   │   │   ├── ConsumedMessage.java
│   │   │   │   ├── MessageRequest.java
│   │   │   │   └── MessageResponse.java
│   │   │   └── service/
│   │   │       ├── KafkaConsumerService.java
│   │   │       └── KafkaProducerService.java
│   │   └── resources/
│   │       ├── application.yaml
│   │       ├── application-local.yaml
│   │       └── application-ecs.yaml
│   └── test/
├── docker-compose.yml
├── docker-compose-java17.yml
├── docker-compose-java21.yml
├── docker-compose-java25.yml
├── Dockerfile.java17
├── Dockerfile.java21
├── Dockerfile.java25
└── pom.xml
```

## 📝 Example Usage

### Send a message to the orders topic

```bash
curl -X POST http://localhost:8080/messages \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "orders",
    "key": "order-001",
    "payload": {
      "orderId": "001",
      "customerId": "C123",
      "amount": 149.99,
      "items": ["item1", "item2"]
    }
  }'
```

### Get consumed messages

```bash
curl http://localhost:8080/messages/consumed?limit=5
```

### Check health

```bash
curl http://localhost:8080/actuator/health
```

## 🤝 Comparison with RDS Application

This Kafka application is designed to be comparable with the RDS-based Spring Boot application in this repository:

| Feature | RDS App | Kafka App |
|---------|---------|-----------|
| Data Storage | PostgreSQL | Kafka Topics |
| Data Operations | CRUD (JPA) | Produce/Consume |
| Persistence | Relational DB | Event Stream |
| Scalability | Vertical + Read Replicas | Horizontal Partitioning |
| Use Case | OLTP | Event Streaming |

Both applications provide REST APIs, metrics, and multi-Java version support for comprehensive benchmarking.

## 📄 License

This is a benchmarking and testing repository for internal use.
