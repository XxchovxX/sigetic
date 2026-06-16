# Migración de SIGETIC a Oracle Cloud

Esta guía mueve SIGETIC desde Render o entorno local hacia una VM de Oracle Cloud Infrastructure usando Docker Compose.

## Arquitectura recomendada

- 1 VM pública en Oracle Cloud Always Free.
- Ubuntu 24.04 o 22.04.
- Shape recomendado: `VM.Standard.A1.Flex`.
- Tamaño recomendado: 2 OCPU y 12 GB RAM.
- Disco inicial: 50 GB.
- Contenedores:
  - `caddy`: HTTPS público en puertos 80 y 443.
  - `web`: Next.js privado dentro de Docker.
  - `api`: ASP.NET Core privado dentro de Docker.
  - `db`: PostgreSQL privado dentro de Docker.

No se deben abrir públicamente los puertos `3000`, `8080` ni `5432`.

## 1. Crear la VM en Oracle

En Oracle Cloud:

1. Ir a `Compute` -> `Instances`.
2. Crear instancia.
3. Imagen: Ubuntu.
4. Shape: `VM.Standard.A1.Flex`.
5. OCPU: `2`.
6. Memoria: `12 GB`.
7. Public IPv4: habilitado.
8. Guardar la llave SSH privada.

## 2. Abrir puertos en la red de Oracle

En la VCN o Security List asociada a la instancia, agregar reglas de ingreso:

| Puerto | Protocolo | Origen | Uso |
| --- | --- | --- | --- |
| 22 | TCP | Tu IP pública, ideal | SSH |
| 80 | TCP | `0.0.0.0/0` | HTTP para Caddy/SSL |
| 443 | TCP | `0.0.0.0/0` | HTTPS público |

## 3. Entrar por SSH

Desde tu equipo:

```bash
ssh ubuntu@IP_PUBLICA
```

Si la llave tiene otro nombre:

```bash
ssh -i /ruta/llave.key ubuntu@IP_PUBLICA
```

## 4. Instalar Docker y preparar firewall interno

En la VM:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/XxchovxX/sigetic.git /opt/sigetic
cd /opt/sigetic
sudo bash scripts/production/oracle-ubuntu-prepare.sh
```

Cerrar sesión y volver a entrar:

```bash
exit
ssh ubuntu@IP_PUBLICA
```

## 5. Crear dominio de prueba

Si todavía no hay dominio institucional, usar `sslip.io`.

Ejemplo con IP `129.80.10.25`:

```text
sigetic.129.80.10.25.sslip.io
```

## 6. Configurar variables

En la VM:

```bash
cd /opt/sigetic
cp .env.web.example .env
nano .env
```

Generar secretos:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Ejemplo:

```env
SIGETIC_DOMAIN=sigetic.IP.PUBLICA.sslip.io

POSTGRES_DB=sigetic
POSTGRES_USER=sigetic_app
POSTGRES_PASSWORD=PEGAR_SECRET_POSTGRES

JWT_ISSUER=SIGETIC.Api
JWT_AUDIENCE=SIGETIC.Web
JWT_SECRET_KEY=PEGAR_SECRET_JWT
JWT_EXPIRATION_MINUTES=480

EMAIL_ENABLED=false
```

Las notificaciones por correo quedan apagadas hasta tener el correo del técnico.

## 7. Levantar SIGETIC

```bash
cd /opt/sigetic
docker compose -f docker-compose.web.yml up -d --build
```

Ver estado:

```bash
docker compose -f docker-compose.web.yml ps
```

Ver logs:

```bash
docker compose -f docker-compose.web.yml logs -f caddy
docker compose -f docker-compose.web.yml logs -f api
docker compose -f docker-compose.web.yml logs -f web
```

## 8. Probar

```bash
curl -I https://$SIGETIC_DOMAIN/login
curl -I https://$SIGETIC_DOMAIN/api/health
```

También abrir en navegador:

```text
https://SIGETIC_DOMAIN/login
```

## 9. Migrar datos desde Render

Si queremos conservar la información de Render:

1. En Render, abrir `sigetic-db`.
2. Buscar la cadena externa de conexión PostgreSQL.
3. En la VM de Oracle, instalar cliente:

```bash
sudo apt-get install -y postgresql-client
```

4. Crear backup desde Render:

```bash
pg_dump "URL_EXTERNA_DE_RENDER" -Fc -f /opt/sigetic-backups/render_sigetic.dump
```

5. Restaurar en PostgreSQL local de Oracle:

```bash
cd /opt/sigetic
docker compose -f docker-compose.web.yml exec -T db \
  pg_restore -U sigetic_app -d sigetic -c < /opt/sigetic-backups/render_sigetic.dump
```

6. Reiniciar API:

```bash
docker compose -f docker-compose.web.yml restart api
```

Si preferimos empezar limpio, omitir este paso.

## 10. Backups diarios

Probar backup:

```bash
cd /opt/sigetic
bash deploy/web/backup.sh
```

Programar backup diario:

```bash
crontab -e
```

Agregar:

```cron
0 2 * * * cd /opt/sigetic && /usr/bin/bash deploy/web/backup.sh >> /opt/sigetic-backups/backup.log 2>&1
```

## 11. Actualizar SIGETIC después

Cuando subamos cambios a GitHub:

```bash
cd /opt/sigetic
git pull
docker compose -f docker-compose.web.yml up -d --build
```

## 12. Apagar Render

Solo apagar Render cuando:

- Oracle abra el login.
- Se pueda iniciar sesión.
- Se creen tickets.
- Se vea inventario.
- Se exporten reportes.
- Se haga backup exitoso.
- Si hay datos de Render, ya estén restaurados en Oracle.

