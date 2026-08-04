FROM maven:3.9.11-eclipse-temurin-21-alpine AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S interviewos && adduser -S interviewos -G interviewos
COPY --from=build /workspace/target/interviewos-api-0.1.0.jar app.jar
USER interviewos
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
