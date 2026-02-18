# Java 17/21/25 Upgrade & Benchmarking Tests

This repository contains a comprehensive benchmarking suite for comparing Java 17, Java 21, and Java 25 performance across various scenarios on AWS ECS Fargate with Amazon RDS.

## 📁 Repository Structure

```
├── Scenarios/              # Test scenario definitions
│   └── REST/              # REST API + RDS test scenarios
├── Comparison.md          # Cost and performance comparison table
└── spring-boot-app/       # Baseline Spring Boot benchmark application
```

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
- **Spring Boot**: 3.4.2
- **Database**: PostgreSQL 15
- **Build**: Maven
- **Container**: Docker with Eclipse Temurin base images
- **Metrics**: Micrometer with Prometheus
- **Infrastructure**: AWS ECS Fargate + Amazon RDS

## 📝 License

This is a benchmarking and testing repository for internal use.

