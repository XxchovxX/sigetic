#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Ejecuta este script con sudo o como root."
  exit 1
fi

APP_USER="${SUDO_USER:-ubuntu}"

apt-get update
apt-get install -y ca-certificates curl gnupg git ufw openssl

install -m 0755 -d /etc/apt/keyrings
if [ ! -f /etc/apt/keyrings/docker.asc ]; then
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
fi

. /etc/os-release
UBUNTU_CODENAME="${UBUNTU_CODENAME:-$VERSION_CODENAME}"

cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable
EOF

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

usermod -aG docker "$APP_USER"
systemctl enable --now docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /opt/sigetic-backups
chown "$APP_USER:$APP_USER" /opt/sigetic-backups

echo "Servidor preparado para SIGETIC."
echo "Cierra sesion y vuelve a entrar para activar el grupo docker del usuario $APP_USER."
