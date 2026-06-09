FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# Copy Maven files
COPY pom.xml ./

# Download dependencies (layer caching)
RUN apk add --no-cache maven && mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -B

# Final stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the JAR from builder
COPY --from=builder /app/target/payment-engine-1.0.0.jar app.jar

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8081/api/payments/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
