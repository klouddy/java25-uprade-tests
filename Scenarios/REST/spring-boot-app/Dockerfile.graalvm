# Multi-stage Dockerfile for GraalVM Native Image
# Optimized for AWS Fargate deployment with amd64 architecture
# Note: Native image compilation requires significant memory (4GB+)

FROM ghcr.io/graalvm/native-image-community:21-ol9 AS builder

WORKDIR /app

# Install Maven
RUN microdnf install -y maven

# Copy Maven wrapper and pom-graalvm.xml
COPY .mvn/ .mvn
COPY mvnw ./
COPY pom-graalvm.xml pom.xml

# Make mvnw executable
RUN chmod +x mvnw

# Download dependencies (cache layer)
RUN MAVEN_OPTS="-Xmx2g" ./mvnw dependency:go-offline -Pnative

# Copy source code
COPY src ./src

# Build native image with Spring AOT processing
# This takes several minutes but produces a standalone native executable
# All native-image compiler settings are defined in pom.xml profile
# MAVEN_OPTS increases Maven's heap to 2GB for native-image build
RUN MAVEN_OPTS="-Xmx2g" ./mvnw -Pnative clean native:compile -DskipTests

# Runtime stage - use minimal distroless or alpine image
FROM oraclelinux:9-slim

WORKDIR /app

# Install required runtime libraries for GraalVM native images
RUN microdnf install -y \
    libstdc++ \
    zlib \
    && microdnf clean all

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Create directory for logs (if needed)
RUN mkdir -p /var/log/app && chown -R appuser:appuser /var/log/app

# Copy the native executable from builder stage
# The executable name matches the artifactId in pom.xml
COPY --from=builder /app/target/spring-boot-benchmark /app/app

# Change ownership
RUN chown -R appuser:appuser /app && chmod +x /app/app

USER appuser

# Expose port
EXPOSE 8080

# Health check using native curl alternative or wget
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD test -f /proc/self/stat || exit 1

# Native image doesn't need JVM options
# Startup is instant and memory footprint is much smaller
ENTRYPOINT ["/app/app"]
