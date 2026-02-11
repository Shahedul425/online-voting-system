FROM eclipse-temurin:21-jre
WORKDIR /app

# OpenTelemetry agent (for Tempo traces)
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/download/v2.7.0/opentelemetry-javaagent.jar /otel.jar

# Copy your locally-built jar
COPY target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java","-javaagent:/otel.jar","-jar","/app/app.jar"]
