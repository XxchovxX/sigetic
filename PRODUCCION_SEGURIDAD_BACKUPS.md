# SIGETIC - Seguridad Y Backups En Producción

Esta guía aplica al servidor Ubuntu de producción donde SIGETIC corre con Docker Compose en `/opt/sigetic`.

## 1. Objetivo

Dejar controles mínimos para operación real:

- Backups automáticos de PostgreSQL.
- Script de restauración.
- Firewall activo.
- Protección contra intentos repetidos de SSH.
- Actualizaciones de seguridad automáticas.
- Revisión rápida de salud del sistema.

## 2. Subir Cambios Al Servidor

En el servidor:

```bash
cd /opt/sigetic
git pull origin main
chmod +x scripts/production/*.sh
```

## 3. Instalar Backups Automáticos

Ejecutar como `root`:

```bash
cd /opt/sigetic
chmod +x scripts/production/*.sh
./scripts/production/install-sigetic-backups.sh
```

Esto crea:

- Script instalado: `/usr/local/bin/sigetic-backup`
- Carpeta de backups: `/opt/sigetic/backups/db`
- Log: `/var/log/sigetic-backup.log`
- Cron diario: `/etc/cron.d/sigetic-backup`

Horario por defecto:

```text
Todos los días a las 02:30 a. m. hora del servidor.
```

Retención por defecto:

```text
14 días.
```

## 4. Ejecutar Backup Manual

```bash
sigetic-backup
```

Ver backups:

```bash
ls -lh /opt/sigetic/backups/db
```

Ver log:

```bash
tail -n 80 /var/log/sigetic-backup.log
```

## 5. Restaurar Un Backup

Advertencia: esto reemplaza la base de datos actual.

```bash
cd /opt/sigetic
./scripts/production/sigetic-restore.sh /opt/sigetic/backups/db/NOMBRE_DEL_BACKUP.dump.gz --yes
```

Después de restaurar:

```bash
docker compose -f docker-compose.web.yml ps
```

## 6. Seguridad Base Del Servidor

Ejecutar como `root`:

```bash
cd /opt/sigetic
./scripts/production/harden-sigetic-server.sh
```

Esto configura:

- `ufw`
- `fail2ban`
- `unattended-upgrades`
- Reglas para SSH, HTTP y HTTPS

No deshabilita el acceso root automáticamente para evitar dejarte fuera del servidor. Ese cambio se hace solo cuando ya exista un usuario administrativo probado con llave SSH.

## 7. Usuario Administrativo Con Llave SSH

Cuando tengas una llave SSH pública, ejecuta:

```bash
cd /opt/sigetic
SIGETIC_ADMIN_USER=sigeticadmin \
SIGETIC_PUBLIC_SSH_KEY='ssh-ed25519 PEGA_AQUI_TU_LLAVE_PUBLICA' \
./scripts/production/harden-sigetic-server.sh
```

Luego prueba desde tu equipo:

```powershell
ssh sigeticadmin@178.104.222.77
```

Cuando ese acceso funcione, se puede endurecer SSH desactivando acceso root por contraseña.

## 8. Revisión De Salud

```bash
cd /opt/sigetic
./scripts/production/sigetic-healthcheck.sh
```

Revisa:

- Estado de contenedores.
- Health de API.
- HTTPS público.
- Uso de disco.
- Últimos backups.

## 9. Recomendaciones Operativas

- Copiar backups fuera del servidor al menos una vez por semana.
- Validar restauración en un entorno de prueba antes de necesitarla por emergencia.
- No guardar contraseñas reales en GitHub.
- Mantener `.env` únicamente en el servidor.
- Revisar espacio en disco cada semana.
- Cambiar credenciales si alguien deja de administrar el sistema.

