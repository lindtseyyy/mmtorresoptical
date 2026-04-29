FROM eclipse-temurin:21-jdk

RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates gpg lsb-release && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | \
      gpg --dearmor -o /usr/share/keyrings/postgresql.asc && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" \
      > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client-18 && \
    apt-get purge -y curl lsb-release && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]