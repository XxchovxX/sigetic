#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${SIGETIC_APP_DIR:-/opt/sigetic}"
COMPOSE_FILE="${SIGETIC_COMPOSE_FILE:-docker-compose.web.yml}"

cd "$APP_DIR"

set -a
# shellcheck disable=SC1091
source "$APP_DIR/.env"
set +a

echo "== Docker Compose =="
docker compose -f "$COMPOSE_FILE" ps

echo
echo "== API health interno =="
docker compose -f "$COMPOSE_FILE" exec -T api sh -c "wget -qO- http://localhost:8080/api/health || curl -fsS http://localhost:8080/api/health" || true

echo
echo "== HTTPS público =="
curl -fsS "https://${SIGETIC_DOMAIN}/api/health" || true

echo
echo "== Disco =="
df -h /

echo
echo "== Últimos backups =="
ls -lh "$APP_DIR"/backups/db/*.dump.gz 2>/dev/null | tail -n 10 || echo "Sin backups todavía."

