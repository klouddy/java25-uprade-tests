# Java 17/21/25 Upgrade & Benchmarking Tests

This repository contains a comprehensive benchmarking suite for comparing Java 17, Java 21, and Java 25 performance across various scenarios on AWS ECS Fargate with Amazon RDS and Amazon MSK.

## 📁 Repository Structure

```
├── Scenarios/              # Test scenario definitions
│   └── REST/              # REST API + RDS test scenarios
├── cdk/                   # AWS CDK infrastructure (TypeScript)
├── Comparison.md          # Cost and performance comparison table
├── spring-boot-app/       # Spring Boot benchmark application (RDS/PostgreSQL)
└── spring-boot-kafka-app/ # Spring Boot benchmark application (Kafka/MSK)
```

## 🏗️ AWS CDK Infrastructure

The `/cdk` directory contains AWS CDK infrastructure-as-code for deploying the benchmark environment:

### Infrastructure Components
- **VPC**: Public and private subnets across 2 AZs
- **ECS Fargate**: Containerized application with configurable CPU/memory
- **Application Load Balancer**: Internet-facing ALB for HTTP traffic
- **RDS Database**: PostgreSQL or MySQL with automated credentials
- **Security Groups**: Minimal, explicit network rules
- **Secrets Manager**: Secure credential storage

### Quick Deploy

```bash
cd cdk

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy infrastructure
cdk deploy -c containerImage=YOUR_ECR_REPO/benchmark-app:java17

# Destroy infrastructure
cdk destroy
```

See [cdk/README.md](cdk/README.md) for complete infrastructure documentation.

## 🚀 Spring Boot Benchmark Application

The `/spring-boot-app` directory contains a minimal but realistic Spring Boot 3.4.2 application designed for benchmarking:

### Features
- **REST API**: Customer and Order management endpoints
- **Database**: PostgreSQL with Flyway migrations
- **Metrics**: Comprehensive JVM, GC, and application metrics via Micrometer
- **Multi-version**: Support for Java 17, 21, and 25
- **Production-ready**: Optimized for load testing and benchmarking

### Quick Start

```bash
cd spring-boot-app

# Build the application
./mvnw clean package

# Run with Docker Compose (includes PostgreSQL)
docker-compose up

# Or run locally (requires PostgreSQL)
java -jar target/spring-boot-benchmark-1.0.0.jar --spring.profiles.active=local
```

### Available Endpoints

- `GET /customers/{id}` - Fetch customer by ID
- `GET /customers?search=term` - Search customers
- `POST /customers` - Create new customer
- `POST /orders` - Create new order
- `GET /actuator/health` - Health check
- `GET /actuator/metrics` - Metrics endpoint
- `GET /actuator/prometheus` - Prometheus metrics

### Docker Images

Build for different Java versions:

```bash
# Java 17
docker build -f Dockerfile.java17 -t benchmark-app:java17 .

# Java 21
docker build -f Dockerfile.java21 -t benchmark-app:java21 .

# Java 25
docker build -f Dockerfile.java25 -t benchmark-app:java25 .
```

See [spring-boot-app/README.md](spring-boot-app/README.md) for complete documentation.

## 🚀 Spring Boot Kafka Benchmark Application

The `/spring-boot-kafka-app` directory contains a Spring Boot 3.5.10 application with Apache Kafka integration designed for benchmarking:

### Features
- **REST API**: Message producer and consumer endpoints
- **Kafka Integration**: Event streaming with AWS MSK support
- **Metrics**: Comprehensive JVM, GC, Kafka, and application metrics via Micrometer
- **Multi-version**: Support for Java 17, 21, and 25
- **Production-ready**: Optimized for load testing and benchmarking with MSK

### Quick Start

```bash
cd spring-boot-kafka-app

# Build the application
./mvnw clean package

# Run with Docker Compose (includes Kafka and Zookeeper)
docker-compose up

# Or run locally (requires Kafka)
java -jar target/spring-boot-kafka-benchmark-1.0.0.jar --spring.profiles.active=local
```

### Available Endpoints

- `POST /messages` - Send message to Kafka topic
- `POST /messages/topic/{topic}` - Send message to specific topic
- `GET /messages/consumed?limit=10` - Get consumed messages
- `DELETE /messages/consumed` - Clear consumed messages
- `GET /actuator/health` - Health check
- `GET /actuator/metrics` - Metrics endpoint
- `GET /actuator/prometheus` - Prometheus metrics

### Docker Images

Build for different Java versions:

```bash
# Java 17
docker build -f Dockerfile.java17 -t kafka-benchmark:java17 .

# Java 21
docker build -f Dockerfile.java21 -t kafka-benchmark:java21 .

# Java 25
docker build -f Dockerfile.java25 -t kafka-benchmark:java25 .
```

See [spring-boot-kafka-app/README.md](spring-boot-kafka-app/README.md) for complete documentation.

## 📊 Test Scenarios

The repository includes comprehensive test scenarios for evaluating:

- **Performance**: Throughput and latency under sustained load
- **Scalability**: Ramp-up tests and burst handling
- **Operational**: Cold start and rolling deployment behavior
- **Resource Efficiency**: Memory, CPU, and GC performance

See [Scenarios/REST/rest-rds-scenarios.md](Scenarios/REST/rest-rds-scenarios.md) for detailed scenario definitions.

## 📈 Cost Analysis

Track and compare the operational costs of running the application on different Java versions in [Comparison.md](Comparison.md).

## 🔧 Technologies

- **Java**: 17, 21, 25
- **Spring Boot**: 3.4.2 (RDS app), 3.5.10 (Kafka app)
- **Database**: PostgreSQL 15
- **Messaging**: Apache Kafka 7.7.0 / AWS MSK
- **Build**: Maven
- **Container**: Docker with Eclipse Temurin base images
- **Metrics**: Micrometer with Prometheus
- **Infrastructure**: AWS ECS Fargate + Amazon RDS/MSK

## 📝 License

This is a benchmarking and testing repository for internal use.

