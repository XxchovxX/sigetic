#!/usr/bin/env sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-/opt/sigetic-backups}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.web.yml}"
POSTGRES_DB="${POSTGRES_DB:-sigetic}"
POSTGRES_USER="${POSTGRES_USER:-sigetic_app}"

mkdir -p "$BACKUP_DIR"

backup_file="$BACKUP_DIR/sigetic_$(date +%Y%m%d_%H%M%S).dump"

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$backup_file"

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_restore -l < "$backup_file" > /dev/null

echo "Backup created and verified: $backup_file"
