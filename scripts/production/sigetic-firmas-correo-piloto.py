#!/usr/bin/env python3
"""Prueba interactiva del TH-F-122 en la base aislada del piloto."""
import argparse
import base64
import getpass
import hashlib
import json
import os
from pathlib import Path
import secrets
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
from uuid import uuid4

NETWORK = "sigetic-firmas-piloto"
PILOT_DB = "sigetic-firmas-db-piloto"
PILOT_API = "sigetic-firmas-api-piloto"
URL = "http://127.0.0.1:4311"
FIRMAS = "/api/documentos-firma"


def docker(*args, **kwargs):
    return subprocess.check_output(["docker", *args], text=True, **kwargs).strip()


def config(container):
    result = json.loads(docker("inspect", "--format", "{{json .Config.Env}}", container))
    return dict(pair.split("=", 1) for pair in result if "=" in pair)


def request(path, token=None, payload=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = None if payload is None else json.dumps(payload).encode()
    try:
        with urllib.request.urlopen(urllib.request.Request(URL + path, data, headers), timeout=25) as reply:
            content = reply.read()
            return content if reply.headers.get_content_type() == "application/pdf" else json.loads(content)
    except urllib.error.HTTPError as error:
        detail = error.read(2048)
        try:
            message = json.loads(detail).get("message", "")
        except (ValueError, AttributeError):
            message = ""
        raise RuntimeError(f"{path}: HTTP {error.code}. {message}") from None


def create_account(address, name):
    password = secrets.token_urlsafe(24)
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    b64 = lambda data: base64.b64encode(data).decode()
    password_hash = f"PBKDF2$100000${b64(salt)}${b64(digest)}"
    sql = """
        INSERT INTO usuarios (id, correo, nombre_completo, password_hash, rol_id, activo, fecha_creacion_utc, cargo)
        SELECT :'id', :'correo', :'nombre', :'hash', id, true, now(), 'Perfil de prueba'
        FROM roles WHERE nombre = 'Funcionario';
    """
    output = docker("exec", "-i", PILOT_DB, "psql", "-X", "-U", "sigetic_piloto",
                    "-d", "sigetic_firmas_piloto", "-v", "ON_ERROR_STOP=1",
                    "-v", f"id={uuid4()}", "-v", f"correo={address}",
                    "-v", f"nombre={name}", "-v", f"hash={password_hash}", input=sql)
    if output != "INSERT 0 1":
        raise RuntimeError("No se pudo crear la cuenta de prueba con el rol Funcionario.")
    return request("/api/auth/login", payload={"correo": address, "password": password})["token"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--nueva-clave', action='store_true', help='Usa una contraseña de aplicación solo durante esta prueba')
    options = parser.parse_args()
    pilot = config(PILOT_API)
    if "Database=sigetic_firmas_piloto;" not in pilot.get("ConnectionStrings__SigeticDatabase", ""):
        raise RuntimeError("La API no usa la base aislada esperada.")
    prod = config("sigetic-api-1")
    if prod.get("Email__SmtpHost", "").lower() != "smtp.gmail.com":
        raise RuntimeError("El servicio actual no está configurado con Gmail.")
    username = prod.get("Email__SmtpUser", "").strip()
    local, _, domain = username.partition("@")
    if not local or domain.lower() not in ("gmail.com", "googlemail.com"):
        raise RuntimeError("El remitente configurado no es una cuenta Gmail personal.")
    print(f"Se enviarán dos códigos del documento de prueba a {local[:2]}***@{domain}, con alias distintos.")
    if input("Escribe SI para iniciar el envío de prueba: ").strip().upper() != "SI":
        return
    password = getpass.getpass("Contraseña de aplicación nueva de Gmail: ") if options.nueva_clave else prod.get("Email__SmtpPassword", "")
    password = "".join(password.split())
    if len(password) != 16 or not password.isascii() or not password.isalnum():
        raise RuntimeError("Google requiere una contraseña de aplicación de 16 caracteres.")
    env = dict(os.environ)
    settings = {
        "ConnectionStrings__SigeticDatabase": pilot["ConnectionStrings__SigeticDatabase"],
        "Jwt__SecretKey": pilot["Jwt__SecretKey"],
        "Jwt__Issuer": pilot["Jwt__Issuer"],
        "Jwt__Audience": pilot["Jwt__Audience"],
        "ASPNETCORE_URLS": "http://+:8080",
        "Firmas__ProveedorCorreo": "Gmail",
        "Email__SmtpHost": "smtp.gmail.com",
        "Email__SmtpUser": username,
        "Email__SmtpPassword": password,
    }
    env.update(settings)
    arguments = [part for key in settings for part in ("-e", key)]
    container = docker("run", "-d", "--network", NETWORK, "-p", "127.0.0.1:4311:8080",
                       *arguments, "sigetic-api-firmas-piloto", env=env)
    try:
        for attempt in range(30):
            try:
                request("/api/health")
                break
            except (OSError, RuntimeError):
                if attempt == 29:
                    raise RuntimeError("La API temporal de correo no respondió.")
                time.sleep(2)

        run_id = secrets.token_hex(4)
        first, second = (f"{local.split('+', 1)[0]}+sigetic-{role}-{run_id}@{domain}" for role in ("entrega", "recibe"))
        entrega = create_account(first, "Piloto entrega")
        recibe = create_account(second, "Piloto recibe")

        date = time.strftime("%Y-%m-%d")
        doc = request(FIRMAS, entrega, {
            "correoRecibe": second,
            "campos": {"general": [["Planeación", "Contratista", "", "Prueba de SIGETIC",
                                   date, "", "Supervisor de prueba", "", date]]},
        })
        path = FIRMAS + "/" + doc["id"]
        original = request(path + "/pdf", entrega)
        if not original.startswith(b"%PDF-") or hashlib.sha256(original).hexdigest() != doc["sha256"]:
            raise RuntimeError("El PDF original no coincide con la huella registrada.")

        for label, token in (("ENTREGA", entrega), ("RECIBE", recibe)):
            request(path + "/codigo", token, {})
            signed = request(path + "/firmar", token, {
                "acepta": True,
                "sha256": doc["sha256"],
                "codigo": getpass.getpass(f"Escribe el código de {label} que llegó al Gmail: ").strip(),
            })
            print(f"Firma de {label} registrada.")

        final = request(path + "/pdf?final=true", recibe)
        if not final.startswith(b"%PDF-") or final == original or hashlib.sha256(final).hexdigest() != signed["sha256Final"]:
            raise RuntimeError("El PDF firmado no coincide con la constancia registrada.")
        filename = Path(tempfile.mkdtemp(prefix="sigetic-constancia-")) / "TH-F-122-piloto-firmado.pdf"
        filename.write_bytes(final)
        print("PRUEBA COMPLETA: dos firmas confirmadas y PDF final con huella verificada.")
        print(filename)
    finally:
        docker("rm", "-f", container)


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError, KeyError, ValueError) as error:
        raise SystemExit(f"PRUEBA INCOMPLETA: {error}") from None
