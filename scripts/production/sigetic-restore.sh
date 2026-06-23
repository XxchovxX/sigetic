#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${SIGETIC_APP_DIR:-/opt/sigetic}"
COMPOSE_FILE="${SIGETIC_COMPOSE_FILE:-docker-compose.web.yml}"
BACKUP_FILE="${1:-}"
CONFIRM="${2:-}"

usage() {
  cat <<'EOF'
Uso:
  ./scripts/production/sigetic-restore.sh /ruta/backup.dump.gz --yes

Advertencia:
  Este proceso restaura la base de datos y puede reemplazar datos existentes.
  Úselo solo si entiende el impacto y tiene un backup vigente.
EOF
}

if [[ -z "$BACKUP_FILE" || "$CONFIRM" != "--yes" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "No existe el backup: $BACKUP_FILE"
  exit 1
fi

cd "$APP_DIR"

if [[ ! -f ".env" ]]; then
  echo "No existe $APP_DIR/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

if [[ -z "${POSTGRES_DB:-}" || -z "${POSTGRES_USER:-}" ]]; then
  echo "POSTGRES_DB o POSTGRES_USER no están definidos en .env"
  exit 1
fi

echo "Deteniendo API y web para restaurar con seguridad..."
docker compose -f "$COMPOSE_FILE" stop api web

echo "Copiando backup al contenedor de base de datos..."
TMP_NAME="/tmp/sigetic-restore.dump.gz"
docker compose -f "$COMPOSE_FILE" cp "$BACKUP_FILE" "db:$TMP_NAME"

echo "Restaurando base de datos $POSTGRES_DB..."
docker compose -f "$COMPOSE_FILE" exec -T db sh -c "
  set -e
  gunzip -c '$TMP_NAME' > /tmp/sigetic-restore.dump
  dropdb -U '$POSTGRES_USER' --if-exists '$POSTGRES_DB'
  createdb -U '$POSTGRES_USER' '$POSTGRES_DB'
  pg_restore -U '$POSTGRES_USER' -d '$POSTGRES_DB' --no-owner --no-acl /tmp/sigetic-restore.dump
  rm -f '$TMP_NAME' /tmp/sigetic-restore.dump
"

echo "Levantando servicios..."
docker compose -f "$COMPOSE_FILE" up -d api web caddy
docker compose -f "$COMPOSE_FILE" ps

echo "Restauración finalizada."

