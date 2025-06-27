#!/bin/bash

# --- Load environment variables from .env file
if [ -f ".env.lock" ]; then
    source .env.lock
    echo "Loaded environment variables from .env"
else
    echo "Error: .env file not found. Please ensure it's in the same directory as backup.sh and docker-compose.yml."
    exit 1
fi

echo "Starting PostgreSQL backup..."

DOCKER_SERVICE="postgres"
BACKUP_DIR="${HOME}/pg_backups"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"

# Check if the Docker Compose service is running.
if ! docker compose ps -q "$DOCKER_SERVICE" | grep -q .; then
    echo "Error: Docker Compose service '$DOCKER_SERVICE' is not running."
    echo "Please start your Docker Compose services first (e.g., docker compose up -d)."
    exit 1
fi

echo "Dumping and compressing database '${DB_NAME}' from service '${DOCKER_SERVICE}' to ${BACKUP_FILE}..."

docker compose exec -T "$DOCKER_SERVICE" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# Check the exit status of the pg_dump command
if [ $? -eq 0 ]; then
    echo "Backup successful and compressed! File saved to: ${BACKUP_FILE}"
else
    echo "Error: Backup failed!"
    echo "Please check the database service logs for more details (e.g., docker compose logs ${DOCKER_SERVICE})."
fi

echo "Backup process completed."
