#!/bin/bash

# =============================================================================
# LexPortal - Skrypt Kopii Zapasowej PostgreSQL (backup.sh)
# =============================================================================
# Opis: Eksportuje bazę danych z kontenera Docker i kompresuje ją.
# Użycie: ./backup.sh
# =============================================================================

# Konfiguracja
BACKUP_DIR="./deploy/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
CONTAINER_NAME="lexportal_db_prod"
DB_NAME="lexportal_db_prod"
DB_USER="lexportal_user"

# Tworzenie katalogu jeśli nie istnieje
mkdir -p "$BACKUP_DIR"

echo "--------------------------------------------------------"
echo "Starting LexPortal Database Backup: $TIMESTAMP"
echo "--------------------------------------------------------"

# Sprawdzenie czy kontener działa
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: Container $CONTAINER_NAME is not running!"
    exit 1
fi

# Wykonanie zrzutu (pg_dump)
# Używamy docker exec aby uruchomić pg_dump wewnątrz kontenera
FILENAME="$BACKUP_DIR/lexportal_backup_$TIMESTAMP.sql.gz"

echo "Dumping database $DB_NAME from $CONTAINER_NAME..."

# Wykonujemy zrzut i kompresujemy w locie
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$FILENAME"

# Sprawdzenie statusu
if [ $? -eq 0 ]; then
    echo "SUCCESS: Backup saved to $FILENAME"
    echo "File size: $(du -h "$FILENAME" | cut -f1)"
    
    # Usuwanie kopii starszych niż 7 dni (opcjonalnie)
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +7 -delete
    echo "Old backups cleaned (older than 7 days)."
else
    echo "ERROR: Backup failed!"
    exit 1
fi

echo "--------------------------------------------------------"
echo "Backup process finished."
