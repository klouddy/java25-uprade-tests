# GraalVM Native Image Build for Spring Boot Benchmark App

This setup builds the Spring Boot REST application as a GraalVM native image for deployment on AWS Fargate.

## What is GraalVM Native Image?

GraalVM Native Image compiles Java applications ahead-of-time (AOT) into standalone native executables that:
- **Start instantly** (~0.1s vs 3-5s for JVM)
- **Use less memory** (typically 50-80% reduction)
- **Smaller container images** (~50-100MB vs 200-300MB)
- **No JVM overhead** (no JIT compilation, no class loading)

## Trade-offs

✅ **Advantages:**
- Instant startup time
- Lower memory footprint
- Smaller container images
- Reduced cold start times in serverless/container environments

⚠️ **Limitations:**
- Longer build times (5-10 minutes vs 1-2 minutes)
- No runtime optimizations (no JIT)
- May have lower peak throughput for CPU-intensive workloads
- Some Java features require special configuration (reflection, dynamic proxies)

## Building the Native Image

### Option 1: Using Docker (Recommended)

Build the Docker image with GraalVM native compilation:

```bash
cd Scenarios/REST/spring-boot-app
docker build -f Dockerfile.graalvm -t spring-boot-benchmark:graalvm .
```

**Build time:** Approximately 5-10 minutes (first build). The native-image compiler performs extensive static analysis and AOT compilation.

### Option 2: Local Build with GraalVM

If you have GraalVM installed locally:

```bash
# Use the pom-graalvm.xml configuration
cp pom-graalvm.xml pom.xml

# Build native image
./mvnw -Pnative native:compile -DskipTests

# Run the native executable
./target/spring-boot-benchmark
```

## Running Locally with Docker Compose

```bash
# Start PostgreSQL and the native image app
docker-compose -f docker-compose-graalvm.yml up --build

# Test the endpoints
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/customers

# Stop services
docker-compose -f docker-compose-graalvm.yml down
```

## AWS Fargate Deployment

### 1. Build and Push to ECR

```bash
# Set your AWS region and account ID
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO=spring-boot-benchmark-graalvm

# Create ECR repository
aws ecr create-repository \
    --repository-name $ECR_REPO \
    --region $AWS_REGION

# Authenticate Docker to ECR
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build for linux/amd64 (Fargate architecture)
docker buildx build --platform linux/amd64 \
    -f Dockerfile.graalvm \
    -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest \
    --load .

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest
```

### 2. Update Task Definition

Create a task definition for the GraalVM native image. Key differences from JVM version:

```json
{
  "family": "spring-boot-benchmark-graalvm",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "YOUR_ECR_IMAGE_URI",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "SPRING_PROFILES_ACTIVE",
          "value": "ecs"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/spring-boot-benchmark-graalvm",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "256",
  "memory": "512",
  "runtimePlatform": {
    "cpuArchitecture": "X86_64",
    "operatingSystemFamily": "LINUX"
  }
}
```

**Note:** Native images typically need 50-70% less memory than JVM equivalents. You can start with 512MB instead of 1024MB.

### 3. Deploy Using Runner Script

If you want to use the existing runner infrastructure:

```bash
cd Scenarios/runner

# Create a new run configuration with GraalVM image
# Update the run_config.json to point to your GraalVM ECR image

npm run deploy-task
```

## Benchmarking Native vs JVM

To compare GraalVM native image performance against JVM:

1. **Deploy both versions** to separate ECS services
2. **Run identical k6 load tests** against each
3. **Compare metrics:**
   - Startup time (check CloudWatch logs)
   - Memory usage (avg/max from Container Insights)
   - CPU usage (should be similar or slightly higher for native)
   - Throughput (RPS from k6)
   - Latency (p50/p90/p95 from k6)
   - Cold start performance (scenario 6)

Expected results:
- **Startup:** Native ~100ms vs JVM ~3-5s
- **Memory:** Native ~200-300MB vs JVM ~400-700MB
- **Throughput:** Native may be 5-15% lower for CPU-intensive work
- **Latency:** Similar or slightly better for native (no GC pauses)

## Troubleshooting

### Build Fails with "exit status 137" or Out of Memory

**Cause:** The native-image compiler ran out of memory. GraalVM's native-image compiler needs significant heap memory (typically 3-4GB) to analyze and compile the entire Spring Boot application.

**Error messages:**
```
Error: Image build request for 'spring-boot-benchmark' (pid: 258, path: /app/target) failed with exit status 137
```

**Solution 1: Increase Docker Daemon Memory (Recommended)**

The Docker daemon (whether Docker Desktop or Podman) needs enough memory for the build. 

For **Docker Desktop**:
- Open Docker Desktop preferences
- Go to Resources → Memory
- Increase memory allocation to **at least 6GB** (8GB better for builds)
- Restart Docker

For **Podman**:
```bash
# Podman uses system memory, no configuration needed
# But ensure your system has at least 8GB available
free -h   # Check available memory on Linux
```

**Solution 2: Adjust Native Image Compiler Memory in Dockerfile**

Edit [Dockerfile.graalvm](Dockerfile.graalvm) and modify the Maven build command:

```dockerfile
# For systems with limited memory (reduce to 2GB)
RUN ./mvnw -Pnative native:compile \
    -DskipTests \
    -Dorg.graalvm.buildtools.native.option=-J-Xmx2g

# For systems with more memory (increase to 4GB+)
RUN ./mvnw -Pnative native:compile \
    -DskipTests \
    -Dorg.graalvm.buildtools.native.option=-J-Xmx4g
```

**Solution 3: Reduce Optimization Level**

The Dockerfile uses `-O3` optimization which uses more memory. Reduce to `-O2`:

```dockerfile
# In pom-graalvm.xml, change:
<buildArg>-O2</buildArg>  # Instead of -O3
```

This is 10-15% slower at runtime but needs less memory to compile.

**Solution 4: Two-Step Build Process**

Build locally with more resources, then push to ECR:

```bash
# Build locally (requires 6GB+ available RAM)
podman build -f Dockerfile.graalvm -t spring-boot-graalvm .

# Push to ECR (small image, ~80MB)
podman tag spring-boot-graalvm $ECR_REPO:graalvm-latest
podman push $ECR_REPO:graalvm-latest
```

### Build Fails with "Class not found" or Reflection Errors

Native images require static analysis. If runtime uses reflection, it must be declared.

**Common classes requiring hints:**
- AWS SDK classes
- Hibernate
- Jackson

Create `src/main/resources/META-INF/native-image/reflect-config.json`:

```json
[
  {
    "name": "software.amazon.awssdk.services.cloudwatch.CloudWatchClient",
    "allDeclaredMethods": true,
    "allDeclaredConstructors": true
  },
  {
    "name": "org.hibernate.dialect.PostgreSQL10Dialect",
    "allDeclaredMethods": true,
    "allDeclaredConstructors": true
  }
]
```

### Native Image Runs But Crashes at Runtime

Check logs for missing resources or initialization issues:

```bash
# Run container with logs
podman run -e SPRING_PROFILES_ACTIVE=local spring-boot-graalvm

# Look for errors about:
# - Missing /etc/hosts database
# - Resource loading issues
# - Native reflection failures
```

**Add to Dockerfile at runtime stage if needed:**

```dockerfile
# Install minimal utilities if native image needs them
RUN microdnf install -y \
    ca-certificates \
    libssl \
    && microdnf clean all
```

### Application Starts Slowly or Cold Start Performance Poor

Native images should start in <200ms. If slower:

1. **Check database initialization** - Flyway migrations can be slow
2. **Verify container startup** - Not the native binary itself  
3. **Check log levels** - `INFO` logging is slower than `WARN`
4. **Use local database** - Remote DB connections are slower

### Performance Lower Than Expected (Throughput)

Native images typically have slightly lower peak throughput than JVM with JIT. If significantly lower:

1. **Check GC pressure** - Native images have built-in GC
2. **Increase memory allocation** - More heap = less GC
3. **Verify optimization level** - Use `-O3` for production
4. **Check container CPU allocation** - Native images are CPU-bound

### Build File Not Found

Make sure you're using the correct path:

```bash
# Correct - from spring-boot-app directory
podman build -f Dockerfile.graalvm -t spring-boot-graalvm .

# Correct - from project root
podman build -f Scenarios/REST/spring-boot-app/Dockerfile.graalvm \
    -t spring-boot-graalvm \
    Scenarios/REST/spring-boot-app/
```



## Performance Tuning

The native image is built with `-O3` optimization. Additional tuning options:

```xml
<buildArg>-march=native</buildArg>  <!-- Optimize for build CPU -->
<buildArg>--gc=serial</buildArg>    <!-- Use serial GC (lower memory) -->
<buildArg>--gc=G1</buildArg>        <!-- Use G1 GC (better throughput) -->
```

For Fargate/production, keep settings generic (x86-64) for portability.

## Resources

- [Spring Boot GraalVM Native Image Support](https://docs.spring.io/spring-boot/docs/3.5.x/reference/html/native-image.html)
- [GraalVM Native Image Documentation](https://www.graalvm.org/latest/reference-manual/native-image/)
- [AWS SDK v2 Native Image Support](https://github.com/aws/aws-sdk-java-v2/blob/master/docs/LaunchChangelog.md#native-image-support)
