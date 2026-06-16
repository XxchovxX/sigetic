#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: ./deploy/web/restore.sh /path/to/backup.dump"
  exit 1
fi

BACKUP_FILE="$1"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.web.yml}"
POSTGRES_DB="${POSTGRES_DB:-sigetic}"
POSTGRES_USER="${POSTGRES_USER:-sigetic_app}"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c < "$BACKUP_FILE"

echo "Backup restored: $BACKUP_FILE"
