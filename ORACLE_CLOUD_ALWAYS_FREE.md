# SIGETIC en Oracle Cloud Always Free

Esta es la opcion recomendada para probar SIGETIC en una web real sin pagar VPS al inicio.

## Veredicto

SIGETIC si cabe en Oracle Cloud Always Free, usando una sola maquina virtual:

- Servicio: Compute.
- Shape: `VM.Standard.A1.Flex` Ampere A1, ARM64.
- Tamano recomendado: 2 OCPU y 12 GB RAM.
- Disco: boot volume de 50 GB al inicio.
- Sistema operativo: Ubuntu 24.04 o Ubuntu 22.04.
- Stack: Docker Compose con `web`, `api`, `db` y `caddy`.

No recomiendo usar las instancias AMD micro para SIGETIC. Tienen 1 GB RAM y son muy justas para Next.js, .NET, PostgreSQL y Docker.

## Por que cumple

El sistema actual necesita:

- Frontend Next.js.
- API ASP.NET Core.
- Base de datos PostgreSQL.
- Proxy HTTPS.
- Backups.

Oracle Always Free nos permite correr eso en una sola VM Ampere A1. La base de datos PostgreSQL queda dentro del contenedor `db`, usando el volumen persistente de Docker en el disco de la VM.

No usaremos Autonomous Database ni MySQL HeatWave para esta primera version, porque SIGETIC ya esta construido sobre PostgreSQL. Cambiar de motor ahora agregaria riesgo sin necesidad.

## Recursos que se deben crear en OCI

1. Cuenta Oracle Cloud Free Tier.
2. Region de origen disponible para Always Free.
3. Compartimento, puede ser el principal.
4. VCN publica con subnet publica.
5. Instancia Compute:
   - Image: Ubuntu.
   - Shape: `VM.Standard.A1.Flex`.
   - OCPU: 2.
   - Memory: 12 GB.
   - Public IPv4: si.
   - Boot volume: 50 GB.
6. Reglas de entrada:
   - SSH `22/tcp`, idealmente solo desde la IP del administrador.
   - HTTP `80/tcp`, publico.
   - HTTPS `443/tcp`, publico.

No se deben abrir al publico los puertos `3000`, `5032` ni `5432`.

## Dominio de prueba gratis

Para probar sin comprar dominio todavia, podemos usar `sslip.io` o `nip.io`, que resuelven un nombre basado en la IP publica.

Ejemplo si la IP publica del VPS fuera `129.80.10.25`:

```text
sigetic.129.80.10.25.sslip.io
```

En el archivo `.env` del servidor se usaria:

```env
SIGETIC_DOMAIN=sigetic.129.80.10.25.sslip.io
```

Cuando despues exista dominio institucional, se cambia por algo como:

```text
sigetic.sancarlosdeguaroa.gov.co
```

## Preparar Ubuntu en Oracle

Conectarse por SSH:

```bash
ssh ubuntu@IP_PUBLICA
```

Copiar el proyecto a `/opt/sigetic` por Git o SFTP. Luego ejecutar:

```bash
cd /opt/sigetic
sudo bash scripts/production/oracle-ubuntu-prepare.sh
```

Cerrar sesion y volver a entrar para que el usuario tome el grupo `docker`:

```bash
exit
ssh ubuntu@IP_PUBLICA
```

## Configurar variables

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

Editar:

```env
SIGETIC_DOMAIN=sigetic.IP.PUBLICA.sslip.io
POSTGRES_DB=sigetic
POSTGRES_USER=sigetic_app
POSTGRES_PASSWORD=PEGAR_SECRET_POSTGRES
JWT_ISSUER=SIGETIC.Api
JWT_AUDIENCE=SIGETIC.Web
JWT_SECRET_KEY=PEGAR_SECRET_JWT
JWT_EXPIRATION_MINUTES=480
```

## Levantar SIGETIC

```bash
cd /opt/sigetic
docker compose -f docker-compose.web.yml up -d --build
```

Validar:

```bash
docker compose -f docker-compose.web.yml ps
curl -I https://$SIGETIC_DOMAIN/login
curl -I https://$SIGETIC_DOMAIN/api/health
```

Ver logs si algo falla:

```bash
docker compose -f docker-compose.web.yml logs -f caddy
docker compose -f docker-compose.web.yml logs -f api
docker compose -f docker-compose.web.yml logs -f web
```

## Backup diario recomendado

Crear carpeta:

```bash
sudo mkdir -p /opt/sigetic-backups
sudo chown $USER:$USER /opt/sigetic-backups
```

Probar backup manual:

```bash
bash deploy/web/backup.sh
```

Programar backup diario a las 2:00 a. m.:

```bash
crontab -e
```

Agregar:

```cron
0 2 * * * cd /opt/sigetic && /usr/bin/bash deploy/web/backup.sh >> /opt/sigetic-backups/backup.log 2>&1
```

## Riesgos de Oracle Always Free

- Puede aparecer falta de capacidad al crear Ampere A1 en algunas regiones.
- Oracle puede reclamar instancias Always Free si quedan inactivas segun sus reglas.
- Es gratis dentro de los limites, pero hay que cuidar no crear recursos pagos por error.
- Para produccion formal conviene activar MFA, presupuestos, alertas de costo y backups.

## Decision recomendada

Para SIGETIC:

1. Probar en Oracle Always Free con Ampere A1.
2. Usar `sslip.io` al inicio para publicar sin comprar dominio.
3. Cuando la Alcaldia confirme, migrar a dominio institucional.
4. Mantener backup diario local en la VM y, si es posible, una copia externa.
5. Si Oracle no deja crear Ampere A1 por capacidad, pasar a un VPS economico de 2 vCPU y 4 GB RAM.

