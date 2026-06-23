#!/usr/bin/env bash
set -Eeuo pipefail

ADMIN_USER="${SIGETIC_ADMIN_USER:-sigeticadmin}"
PUBLIC_SSH_KEY="${SIGETIC_PUBLIC_SSH_KEY:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecute este script como root."
  exit 1
fi

echo "Actualizando paquetes base..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y \
  ufw \
  fail2ban \
  unattended-upgrades \
  ca-certificates \
  curl \
  gnupg

echo "Configurando actualizaciones automáticas de seguridad..."
dpkg-reconfigure -f noninteractive unattended-upgrades || true

echo "Configurando firewall UFW..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose

echo "Configurando fail2ban para SSH..."
cat > /etc/fail2ban/jail.d/sshd.local <<'EOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = %(sshd_log)s
maxretry = 5
findtime = 10m
bantime = 1h
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

if [[ -n "$PUBLIC_SSH_KEY" ]]; then
  echo "Creando usuario administrativo $ADMIN_USER con llave SSH..."
  if ! id "$ADMIN_USER" >/dev/null 2>&1; then
    adduser --disabled-password --gecos "" "$ADMIN_USER"
  fi
  usermod -aG sudo,docker "$ADMIN_USER" || usermod -aG sudo "$ADMIN_USER"
  install -d -m 700 -o "$ADMIN_USER" -g "$ADMIN_USER" "/home/$ADMIN_USER/.ssh"
  echo "$PUBLIC_SSH_KEY" > "/home/$ADMIN_USER/.ssh/authorized_keys"
  chown "$ADMIN_USER:$ADMIN_USER" "/home/$ADMIN_USER/.ssh/authorized_keys"
  chmod 600 "/home/$ADMIN_USER/.ssh/authorized_keys"
  echo "Usuario $ADMIN_USER creado/configurado."
else
  echo "No se recibió SIGETIC_PUBLIC_SSH_KEY. Se omite creación de usuario administrativo con llave."
  echo "Cuando tengas una llave SSH pública, ejecuta:"
  echo "  SIGETIC_PUBLIC_SSH_KEY='ssh-ed25519 ...' ./scripts/production/harden-sigetic-server.sh"
fi

echo "Resumen de servicios:"
systemctl --no-pager --full status fail2ban | sed -n '1,12p' || true
echo "Hardening base finalizado."

