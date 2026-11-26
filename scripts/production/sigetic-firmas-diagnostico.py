#!/usr/bin/env python3
"""Diagnostica el SMTP de Gmail desde la red del piloto sin enviar mensajes."""
import json
import subprocess

PROBE = """
import json, smtplib, socket, ssl, sys
stage = "DNS"
try:
    user, password = json.loads(sys.stdin.readline())
    socket.getaddrinfo("smtp.gmail.com", 587, type=socket.SOCK_STREAM)
    print("DNS OK", flush=True)
    stage = "CONEXION TCP Y SALUDO SMTP"
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=12) as client:
        print("CONEXION TCP Y SALUDO SMTP OK", flush=True)
        stage = "STARTTLS"
        client.ehlo()
        client.starttls(context=ssl.create_default_context())
        client.ehlo()
        print("STARTTLS OK", flush=True)
        stage = "AUTENTICACION"
        client.login(user, "".join(password.split()))
        print("AUTENTICACION GMAIL OK", flush=True)
except smtplib.SMTPResponseException as error:
    print(f"FALLO {stage}: SMTP {error.smtp_code}", flush=True)
    sys.exit(1)
except OSError as error:
    print(f"FALLO {stage}: {type(error).__name__}"
          + (f" ({error.errno})" if error.errno is not None else ""), flush=True)
    sys.exit(1)
"""

source = subprocess.check_output([
    "docker", "inspect", "--format", "{{json .Config.Env}}", "sigetic-api-1"
], text=True)
settings = dict(item.split("=", 1) for item in json.loads(source) if "=" in item)
if settings.get("Email__SmtpHost", "").strip().lower() != "smtp.gmail.com":
    raise SystemExit("La API actual no usa smtp.gmail.com.")
user = settings.get("Email__SmtpUser", "").strip()
password = settings.get("Email__SmtpPassword", "")
if not user or not password.strip():
    raise SystemExit("Falta la configuración de usuario o contraseña SMTP.")
result = subprocess.run([
    "docker", "run", "--rm", "-i", "--network", "sigetic-firmas-piloto",
    "python:3.12-alpine", "python3", "-c", PROBE
], input=json.dumps([user, password]) + "\n", text=True, check=False)
raise SystemExit(result.returncode)
