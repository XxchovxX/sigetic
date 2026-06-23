#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${SIGETIC_APP_DIR:-/opt/sigetic}"
COMPOSE_FILE="${SIGETIC_COMPOSE_FILE:-docker-compose.web.yml}"
BACKUP_DIR="${SIGETIC_BACKUP_DIR:-$APP_DIR/backups/db}"
RETENTION_DAYS="${SIGETIC_BACKUP_RETENTION_DAYS:-14}"
LOG_FILE="${SIGETIC_BACKUP_LOG:-/var/log/sigetic-backup.log}"

timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

log() {
  echo "[$(timestamp)] $*" | tee -a "$LOG_FILE"
}

fail() {
  log "ERROR: $*"
  exit 1
}

if [[ ! -d "$APP_DIR" ]]; then
  fail "No existe APP_DIR=$APP_DIR"
fi

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  fail "No existe $APP_DIR/.env"
fi

set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

if [[ -z "${POSTGRES_DB:-}" || -z "${POSTGRES_USER:-}" ]]; then
  fail "POSTGRES_DB o POSTGRES_USER no están definidos en .env"
fi

mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"

STAMP="$(date +"%Y%m%d-%H%M%S")"
BACKUP_FILE="$BACKUP_DIR/sigetic-${POSTGRES_DB}-${STAMP}.dump"

log "Iniciando backup de PostgreSQL: $BACKUP_FILE"

docker compose -f "$COMPOSE_FILE" exec -T db \
  pg_dump \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB" \
    --format=custom \
    --no-owner \
    --no-acl \
  > "$BACKUP_FILE"

if [[ ! -s "$BACKUP_FILE" ]]; then
  rm -f "$BACKUP_FILE"
  fail "El backup quedó vacío"
fi

gzip -f "$BACKUP_FILE"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

log "Backup creado correctamente: $BACKUP_FILE_GZ"

find "$BACKUP_DIR" -type f -name "sigetic-*.dump.gz" -mtime +"$RETENTION_DAYS" -print -delete \
  | while read -r deleted; do log "Backup eliminado por retención: $deleted"; done

log "Backups disponibles:"
ls -lh "$BACKUP_DIR"/sigetic-*.dump.gz 2>/dev/null | tee -a "$LOG_FILE" || true

