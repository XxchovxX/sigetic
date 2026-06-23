#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${SIGETIC_APP_DIR:-/opt/sigetic}"
BACKUP_DIR="${SIGETIC_BACKUP_DIR:-$APP_DIR/backups/db}"
LOG_FILE="${SIGETIC_BACKUP_LOG:-/var/log/sigetic-backup.log}"
RETENTION_DAYS="${SIGETIC_BACKUP_RETENTION_DAYS:-14}"
CRON_FILE="/etc/cron.d/sigetic-backup"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecute este script como root."
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "No existe $APP_DIR. Ejecute esto en el servidor SIGETIC."
  exit 1
fi

install -m 0755 "$APP_DIR/scripts/production/sigetic-backup.sh" /usr/local/bin/sigetic-backup
mkdir -p "$BACKUP_DIR"
touch "$LOG_FILE"
chmod 700 "$BACKUP_DIR"
chmod 640 "$LOG_FILE"

cat > "$CRON_FILE" <<EOF
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
SIGETIC_APP_DIR=$APP_DIR
SIGETIC_BACKUP_DIR=$BACKUP_DIR
SIGETIC_BACKUP_RETENTION_DAYS=$RETENTION_DAYS
SIGETIC_BACKUP_LOG=$LOG_FILE

# Backup diario de SIGETIC a las 02:30 hora del servidor.
30 2 * * * root /usr/local/bin/sigetic-backup >> $LOG_FILE 2>&1
EOF

chmod 644 "$CRON_FILE"

echo "Cron instalado en $CRON_FILE"
echo "Carpeta de backups: $BACKUP_DIR"
echo "Log: $LOG_FILE"
echo "Ejecutando backup de prueba..."
/usr/local/bin/sigetic-backup

