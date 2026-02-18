# Spring Boot Benchmark Application

A baseline Spring Boot 3.x application designed for benchmarking Java 17, Java 21, and Java 25 performance across multiple scenarios on AWS ECS Fargate with Amazon RDS.

## 📋 Overview

This application provides a minimal but realistic REST API for performance testing that includes:
- Customer and Order management
- Database operations with PostgreSQL
- Comprehensive metrics exposure via Micrometer
- Support for multiple Java versions (17, 21, 25)
- Optimized for load testing and benchmarking

## 🏗️ Architecture

### Technology Stack
- **Framework**: Spring Boot 3.4.2
- **Java**: Compatible with Java 17, 21, and 25
- **Database**: PostgreSQL (via Amazon RDS)
- **Build Tool**: Maven
- **Database Migration**: Flyway
- **Metrics**: Micrometer with Prometheus endpoint
- **Containerization**: Docker with multi-stage builds

### Application Structure
```
src/
├── main/
│   ├── java/com/benchmark/app/
│   │   ├── BenchmarkApplication.java    # Main application
│   │   ├── controller/                   # REST controllers
│   │   ├── dto/                          # Request/Response DTOs
│   │   ├── entity/                       # JPA entities
│   │   └── repository/                   # Data repositories
│   └── resources/
│       ├── application.yaml              # Main configuration
│       ├── application-local.yaml        # Local profile
│       ├── application-ecs.yaml          # ECS profile
│       └── db/migration/                 # Flyway migrations
└── test/                                 # Test files
```

## 🔌 API Endpoints

### Customer Management

#### GET /customers/{id}
Fetch a customer by ID.

**Response**: `200 OK` with customer data, or `404 Not Found`

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "createdAt": "2024-01-01T10:00:00Z"
}
```

#### GET /customers?search={term}
Search customers by name or email (uses indexed columns).

**Response**: `200 OK` with array of customers

```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

#### POST /customers
Create a new customer.

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com"
}
```

**Response**: `201 Created` with customer data

### Order Management

#### POST /orders
Create a new order for an existing customer.

**Request Body**:
```json
{
  "customerId": 1,
  "amount": 99.99
}
```

**Response**: `201 Created` with order data

### Actuator Endpoints

- `GET /actuator/health` - Health check
- `GET /actuator/metrics` - Available metrics
- `GET /actuator/prometheus` - Prometheus-formatted metrics
- `GET /actuator/info` - Application info

## 🗄️ Database Schema

### Customers Table
```sql
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL
);
-- Indexes: email, (first_name, last_name)
```

### Orders Table
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL
);
-- Index: customer_id
```

## 🚀 Getting Started

### Prerequisites
- Java 17, 21, or 25 installed
- Maven 3.6+
- PostgreSQL 12+ (or Docker for local PostgreSQL)
- Docker (for containerized deployment)

### Building the Application

#### With Java 17:
```bash
export JAVA_HOME=/path/to/java17
mvn clean package
```

#### With Java 21:
```bash
export JAVA_HOME=/path/to/java21
mvn clean package -Djava.version=21
```

#### With Java 25:
```bash
export JAVA_HOME=/path/to/java25
mvn clean package -Djava.version=25
```

### Running Locally

1. **Start PostgreSQL** (using Docker):
```bash
docker run --name postgres-benchmark \
  -e POSTGRES_DB=benchmark \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:15
```

2. **Run the application**:
```bash
java -jar target/spring-boot-benchmark-1.0.0.jar --spring.profiles.active=local
```

Or use Maven:
```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

3. **Verify it's running**:
```bash
curl http://localhost:8080/actuator/health
```

### Running with Docker

#### Java 17

Build Docker image:
```bash
docker build -f Dockerfile.java17 -t benchmark-app:java17 .
```

Run with Docker (requires PostgreSQL):
```bash
docker run -d --name benchmark-app-java17 \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/benchmark \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e SPRING_PROFILES_ACTIVE=ecs \
  -e JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0" \
  benchmark-app:java17
```

Or use Docker Compose (includes PostgreSQL):
```bash
docker-compose -f docker-compose-java17.yml up
```

#### Java 21

Build Docker image:
```bash
docker build -f Dockerfile.java21 -t benchmark-app:java21 .
```

Run with Docker (requires PostgreSQL):
```bash
docker run -d --name benchmark-app-java21 \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/benchmark \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e SPRING_PROFILES_ACTIVE=ecs \
  -e JAVA_TOOL_OPTIONS="-XX:+UseZGC -XX:MaxRAMPercentage=75.0" \
  benchmark-app:java21
```

Or use Docker Compose (includes PostgreSQL):
```bash
docker-compose -f docker-compose-java21.yml up
```

#### Java 25

Build Docker image:
```bash
docker build -f Dockerfile.java25 -t benchmark-app:java25 .
```

Run with Docker (requires PostgreSQL):
```bash
docker run -d --name benchmark-app-java25 \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/benchmark \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=postgres \
  -e SPRING_PROFILES_ACTIVE=ecs \
  -e JAVA_TOOL_OPTIONS="-XX:+UseZGC -XX:MaxRAMPercentage=75.0" \
  benchmark-app:java25
```

Or use Docker Compose (includes PostgreSQL):
```bash
docker-compose -f docker-compose-java25.yml up
```

#### Run All Versions Together (for comparison)

The main `docker-compose.yml` allows running all Java versions simultaneously on different ports:
```bash
# Run Java 17 only (default)
docker-compose up

# Run Java 17 and Java 21
docker-compose --profile java21 up

# Run all versions (Java 17, 21, and 25)
docker-compose --profile java21 --profile java25 up
```

This starts:
- Java 17 app on port 8080
- Java 21 app on port 8081 (when java21 profile is active)
- Java 25 app on port 8082 (when java25 profile is active)
- PostgreSQL on port 5432 (shared by all apps)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | JDBC connection string | `jdbc:postgresql://localhost:5432/benchmark` |
| `DATABASE_USER` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DB_POOL_SIZE` | HikariCP max pool size | `20` (local), `50` (ECS) |
| `SERVER_PORT` | Application port | `8080` |
| `TOMCAT_MAX_THREADS` | Max Tomcat threads | `200` |
| `JAVA_TOOL_OPTIONS` | JVM options | See Dockerfiles |
| `SPRING_PROFILES_ACTIVE` | Active profile | `default` |

### JVM Configuration Examples

#### G1 GC (Java 17):
```bash
export JAVA_TOOL_OPTIONS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"
java -jar app.jar
```

#### ZGC (Java 21+):
```bash
export JAVA_TOOL_OPTIONS="-XX:+UseZGC -XX:MaxRAMPercentage=75.0"
java -jar app.jar
```

#### Virtual Threads (Java 21+):
Virtual threads are automatically used by Spring Boot 3.2+ when running on Java 21+. No additional configuration needed.

## 📊 Metrics

The application exposes comprehensive JVM and application metrics:

### JVM Metrics
- `jvm.memory.used` - Memory usage by pool
- `jvm.memory.max` - Max memory by pool
- `jvm.gc.pause` - GC pause times
- `jvm.gc.memory.allocated` - Memory allocation rate
- `jvm.threads.live` - Live thread count
- `jvm.threads.peak` - Peak thread count

### Application Metrics
- `http.server.requests` - HTTP request metrics with percentiles
- `hikaricp.connections.active` - Active DB connections
- `hikaricp.connections.pending` - Pending connection requests

### Accessing Metrics

**Prometheus format**:
```bash
curl http://localhost:8080/actuator/prometheus
```

**JSON format**:
```bash
curl http://localhost:8080/actuator/metrics
curl http://localhost:8080/actuator/metrics/jvm.memory.used
```

## 🧪 Testing the Application

### Create a Customer
```bash
curl -X POST http://localhost:8080/customers \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com"
  }'
```

### Get Customer by ID
```bash
curl http://localhost:8080/customers/1
```

### Search Customers
```bash
curl http://localhost:8080/customers?search=john
```

### Create an Order
```bash
curl -X POST http://localhost:8080/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 1,
    "amount": 149.99
  }'
```

## 🔬 Load Testing

This application is designed to be load-test ready:

- **Fixed response sizes** - No randomness in responses
- **Consistent behavior** - Deterministic logic throughout
- **Optimized queries** - Indexed columns for searches
- **Connection pooling** - Configurable HikariCP settings
- **Efficient serialization** - Jackson with optimal settings

### Sample Load Test (using k6)
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  // 60% reads
  let res1 = http.get('http://localhost:8080/customers/1');
  check(res1, { 'status 200': (r) => r.status === 200 });
  
  // 20% search
  let res2 = http.get('http://localhost:8080/customers?search=doe');
  check(res2, { 'status 200': (r) => r.status === 200 });
  
  // 20% writes
  let res3 = http.post('http://localhost:8080/customers',
    JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: `test${Date.now()}@example.com`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(res3, { 'status 201': (r) => r.status === 201 });
}
```

## 📦 Deployment to AWS ECS Fargate

### Build and Push to ECR
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -f Dockerfile.java17 -t benchmark-app:java17 .
docker tag benchmark-app:java17 ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17

# Push
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/benchmark-app:java17
```

### ECS Task Definition
The application uses the `ecs` profile which:
- Reads database credentials from environment variables
- Configures larger connection pool (50 connections)
- Optimizes thread pool for container environment
- Exposes health and metrics endpoints

Required environment variables in ECS:
- `DATABASE_URL`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `SPRING_PROFILES_ACTIVE=ecs`

## 📈 Benchmarking Scenarios

This application supports the following test scenarios (see `/Scenarios/REST/rest-rds-scenarios.md`):

1. **Read-Heavy** - 60% reads, 20% search, 20% writes
2. **Balanced** - 40% reads, 20% search, 40% writes
3. **Write-Heavy** - 10% reads, 10% search, 80% writes
4. **Ramp-Up Scalability** - Gradual load increase
5. **Burst/Spike** - Sudden traffic spikes
6. **Cold Start** - Startup time measurement
7. **Warm Start** - Rolling deployment behavior

## 🛠️ Troubleshooting

### Application won't start
- Verify PostgreSQL is running and accessible
- Check database credentials
- Ensure port 8080 is not in use
- Check logs for Flyway migration errors

### High memory usage
- Adjust `MaxRAMPercentage` in `JAVA_TOOL_OPTIONS`
- Check connection pool size (`DB_POOL_SIZE`)
- Review GC logs and settings

### Slow queries
- Verify indexes exist on `customers.email`
- Check connection pool exhaustion
- Monitor with `actuator/metrics`

### Docker build fails
- Ensure Maven wrapper is executable: `chmod +x mvnw`
- Check Docker daemon is running
- Verify Java version in Dockerfile matches build requirements

## 📝 License

This is a benchmarking application for internal use.

## 👥 Contributing

This is part of the Java 17/21/25 upgrade testing project. See the main repository README for contribution guidelines.
