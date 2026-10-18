# Multi-stage build for Kotlin / Spring Boot API
FROM eclipse-temurin:21-jdk-jammy AS builder
WORKDIR /workspace

# Copy gradle files
COPY gradlew gradlew.bat settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle

# Grant execute permission for gradlew
RUN chmod +x ./gradlew

# Download dependencies (cache layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code and build production JAR
COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

# Runtime stage
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Run as non-root user for security
RUN groupadd -r campus && useradd -r -g campus campus
USER campus

COPY --from=builder /workspace/build/libs/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -jar -Dserver.port=${PORT} -Djava.security.egd=file:/dev/./urandom app.jar"]
