#!/bin/bash

# =============================================================================
# LexPortal - Skrypt Przywracania Bazy Danych (restore.sh)
# =============================================================================
# Opis: Przywraca bazę danych z pliku .sql.gz do kontenera Docker.
# Użycie: ./restore.sh [ścieżka_do_pliku_backupu]
# Przykład: ./restore.sh ./deploy/backups/lexportal_backup_2026-02-28_09-03-29.sql.gz
# =============================================================================

# Konfiguracja
CONTAINER_NAME="lexportal_db_prod"
DB_NAME="lexportal_db_prod"
DB_USER="lexportal_user"

# Sprawdzenie czy podano plik
if [ -z "$1" ]; then
    echo "ERROR: No backup file specified!"
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1

# Sprawdzenie czy plik istnieje
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: File $BACKUP_FILE not found!"
    exit 1
fi

# Sprawdzenie czy kontener działa
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: Container $CONTAINER_NAME is not running!"
    exit 1
fi

echo "--------------------------------------------------------"
echo "WARNING: This will overwrite the current database $DB_NAME!"
echo "Backup file: $BACKUP_FILE"
echo "--------------------------------------------------------"
read -p "Are you sure you want to proceed? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Starting restore process..."

# Przywracanie: dekompresja i przekierowanie do psql wewnątrz kontenera
# Najpierw usuwamy schemat public (opcjonalnie, zależy od pg_dump -c)
# Dla bezpieczeństwa używamy standardowego potoku
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

# Sprawdzenie statusu
if [ $? -eq 0 ]; then
    echo "--------------------------------------------------------"
    echo "SUCCESS: Database restored successfully from $BACKUP_FILE"
else
    echo "--------------------------------------------------------"
    echo "ERROR: Restore failed!"
    exit 1
fi

echo "--------------------------------------------------------"
