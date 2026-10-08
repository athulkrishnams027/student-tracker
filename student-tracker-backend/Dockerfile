# Step 1: Use Java 17
FROM eclipse-temurin:17-jdk

# Step 2: Create a working directory inside the container
WORKDIR /app

# Step 3: Copy the Spring Boot JAR into the container
COPY target/*.jar app.jar

# Step 4: Tell Docker that the application uses port 8080
EXPOSE 8080

# Step 5: Start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]