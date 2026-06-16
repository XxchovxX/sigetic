# SIGETIC - Producción web pública con VPS

Esta es la ruta correcta cuando no hay servidor físico o computador permanente en la Alcaldía.

## 1. Arquitectura recomendada

Usar un VPS con Docker Compose:

- `caddy`: entrada pública por HTTP/HTTPS.
- `web`: frontend Next.js standalone.
- `api`: backend ASP.NET Core interno.
- `db`: PostgreSQL con volumen persistente.

Los usuarios entran por:

```text
https://DOMINIO/login
```

La API no se expone directamente al público. El frontend atiende `/api/*` y reenvía internamente al contenedor `api`.

## 2. VPS recomendado

Mínimo funcional:

- 2 vCPU.
- 4 GB RAM.
- 60 GB SSD.
- Ubuntu 24.04 LTS.
- Docker Engine + Docker Compose.
- Backups automáticos del proveedor.

Mejor para operación estable:

- 4 vCPU.
- 8 GB RAM.
- 100 GB SSD.
- Backup diario.
- Firewall administrable.

Proveedores posibles:

- DigitalOcean.
- Hetzner.
- Linode/Akamai.
- Vultr.
- AWS Lightsail.
- Azure VM.

Para este sistema, un VPS simple es mejor que hosting compartido, porque se necesita correr .NET, Node/Next.js y PostgreSQL juntos.

## 3. Dominio

Comprar o usar un subdominio institucional, por ejemplo:

```text
sigetic.sancarlosdeguaroa.gov.co
```

Crear registro DNS:

```text
Tipo: A
Nombre: sigetic
Valor: IP_PUBLICA_DEL_VPS
TTL: 300
```

Cuando el DNS apunte al VPS, Caddy solicitará y renovará HTTPS automáticamente.

## 4. Preparar el VPS

Conectarse por SSH:

```bash
ssh root@IP_PUBLICA_DEL_VPS
```

Instalar Docker:

```bash
apt update
apt install -y ca-certificates curl gnupg git ufw
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Firewall:

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

## 5. Subir SIGETIC

Opción simple con Git:

```bash
cd /opt
git clone URL_DEL_REPOSITORIO sigetic
cd /opt/sigetic
```

Si no hay repositorio Git, copiar la carpeta por SFTP/SCP a:

```text
/opt/sigetic
```

## 6. Crear variables de producción

Crear `.env` en la raíz del proyecto del VPS:

```bash
cp .env.web.example .env
nano .env
```

Ejemplo:

```env
SIGETIC_DOMAIN=sigetic.sancarlosdeguaroa.gov.co
POSTGRES_DB=sigetic
POSTGRES_USER=sigetic_app
POSTGRES_PASSWORD=CAMBIAR_PASSWORD_POSTGRES_LARGO
JWT_ISSUER=SIGETIC.Api
JWT_AUDIENCE=SIGETIC.Web
JWT_SECRET_KEY=CAMBIAR_LLAVE_JWT_MINIMO_64_CARACTERES_ALEATORIOS
JWT_EXPIRATION_MINUTES=480
```

Generar secretos:

```bash
openssl rand -base64 48
```

Usar uno para `POSTGRES_PASSWORD` y otro para `JWT_SECRET_KEY`.

## 7. Levantar producción

```bash
cd /opt/sigetic
docker compose -f docker-compose.web.yml up -d --build
```

Ver estado:

```bash
docker compose -f docker-compose.web.yml ps
docker compose -f docker-compose.web.yml logs -f caddy
docker compose -f docker-compose.web.yml logs -f api
```

Validar:

```bash
curl -I https://DOMINIO/login
curl -I https://DOMINIO/api/health
```

## 8. Actualizar versión

```bash
cd /opt/sigetic
git pull
docker compose -f docker-compose.web.yml up -d --build
```

## 9. Backups

Crear carpeta:

```bash
mkdir -p /opt/sigetic-backups
```

Backup manual:

```bash
docker compose -f docker-compose.web.yml exec -T db pg_dump -U sigetic_app -d sigetic -Fc > /opt/sigetic-backups/sigetic_$(date +%Y%m%d_%H%M).dump
```

Verificar backup:

```bash
docker compose -f docker-compose.web.yml exec -T db pg_restore -l < /opt/sigetic-backups/ARCHIVO.dump
```

Restaurar:

```bash
docker compose -f docker-compose.web.yml exec -T db pg_restore -U sigetic_app -d sigetic -c < /opt/sigetic-backups/ARCHIVO.dump
```

## 10. Pendientes obligatorios antes de abrir a usuarios

- Definir dominio real.
- Apuntar DNS al VPS.
- Configurar `.env` real.
- Levantar con `docker compose`.
- Verificar HTTPS.
- Cambiar contraseñas demo.
- Crear usuarios reales.
- Probar roles desde navegador.
- Programar backups diarios.
- Probar restauración de backup.
- Activar backups/snapshots del proveedor del VPS.
- Revisar logs una vez al día durante la primera semana.
