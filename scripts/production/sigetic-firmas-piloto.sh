#!/usr/bin/env bash
set -euo pipefail

# Instancia local aislada. La base de datos contiene únicamente datos de prueba.
network=sigetic-firmas-piloto
db=sigetic-firmas-db-piloto
api=sigetic-firmas-api-piloto
web=sigetic-firmas-web-piloto

for name in "$db" "$api" "$web"; do
  if docker container inspect "$name" >/dev/null 2>&1; then
    printf 'Ya existe %s. Revisa el piloto que quedó iniciado.\n' "$name" >&2
    exit 1
  fi
done

docker image inspect sigetic-api-firmas-piloto sigetic-web-firmas-piloto >/dev/null
export POSTGRES_PASSWORD
POSTGRES_PASSWORD=$(openssl rand -hex 24)
export Jwt__SecretKey
Jwt__SecretKey=$(openssl rand -hex 32)
export ConnectionStrings__SigeticDatabase="Host=db;Database=sigetic_firmas_piloto;Username=sigetic_piloto;Password=$POSTGRES_PASSWORD"

docker network create "$network" >/dev/null
docker run -d --name "$db" --network "$network" --network-alias db \
  -e POSTGRES_USER=sigetic_piloto -e POSTGRES_DB=sigetic_firmas_piloto -e POSTGRES_PASSWORD \
  postgres:17-alpine >/dev/null

until docker exec "$db" pg_isready -h 127.0.0.1 -U sigetic_piloto -d sigetic_firmas_piloto >/dev/null 2>&1; do
  db_attempts=$(( ${db_attempts:-0} + 1 ))
  if (( db_attempts >= 30 )); then
    printf 'La base aislada no respondió. Revisa el contenedor %s.\n' "$db" >&2
    exit 1
  fi
  sleep 2
done

docker run -d --name "$api" --network "$network" --network-alias api \
  -e ASPNETCORE_URLS=http://+:8080 -e ConnectionStrings__SigeticDatabase \
  -e Database__ApplyMigrationsOnStartup=true \
  -e Jwt__Issuer=SIGETIC.Piloto -e Jwt__Audience=SIGETIC.Piloto -e Jwt__SecretKey \
  sigetic-api-firmas-piloto >/dev/null

docker run -d --name "$web" --network "$network" -p 127.0.0.1:4310:3000 \
  -e SIGETIC_INTERNAL_API_URL=http://api:8080 -e NEXT_PUBLIC_API_URL=http://api:8080 \
  sigetic-web-firmas-piloto >/dev/null

for ((attempt = 1; attempt <= 40; attempt++)); do
  if curl -fsS --max-time 3 http://127.0.0.1:4310/api/health >/dev/null 2>&1 &&
     curl -fsS --max-time 3 http://127.0.0.1:4310/login >/dev/null 2>&1; then
    if ! docker exec "$db" psql -U sigetic_piloto -d sigetic_firmas_piloto -Atc 'SELECT 1 FROM documentos_firma LIMIT 0' >/dev/null; then
      printf 'La API responde, pero falta la tabla de firmas en la base del piloto.\n' >&2
      exit 1
    fi
    printf 'PILOTO LISTO: interfaz y API disponibles en 127.0.0.1:4310.\n'
    exit 0
  fi
  sleep 2
done

printf 'El piloto no respondió. Revisa los registros de %s y %s.\n' "$api" "$web" >&2
exit 1
