# ---------- Etapa 1: compilar con Maven ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Primero solo el pom para aprovechar la caché de dependencias
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q package -DskipTests

# ---------- Etapa 2: imagen liviana para ejecutar ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/crud-productos.jar app.jar

ENV TZ=America/Bogota
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
