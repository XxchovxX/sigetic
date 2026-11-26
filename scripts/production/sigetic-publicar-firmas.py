#!/usr/bin/env python3
"""Publica la revisión comprobada de firmas y conserva los cambios locales."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

PROD = Path("/opt/sigetic")
RELEASE = Path(__file__).resolve().parents[2]
BASE = "89f73a3b96c3da31bbfce57018a4e27313348bc9"
BASE_PLANTILLA = "5698b48967e6a0cb87b73ecb42fc7f3c4060584b"


def run(*args, **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def git(repo, *args):
    return run("git", "-C", str(repo), *args, stdout=subprocess.PIPE).stdout


def compose(*args, **kwargs):
    environment = {key: value for key, value in os.environ.items() if not key.startswith("FIRMAS_")}
    return run("docker", "compose", "-f", "docker-compose.web.yml", *args, cwd=PROD, env=environment, **kwargs)


def paths(data):
    return set(filter(None, data.split(b"\0")))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--membrete", "--plantilla", dest="plantilla", action="store_true", help="Actualiza el membrete y reutiliza el entorno de producción")
    plantilla = parser.parse_args().plantilla
    base = BASE_PLANTILLA if plantilla else BASE
    if os.geteuid() != 0:
        raise RuntimeError("Ejecuta el script desde la consola administrativa del servidor.")
    os.umask(0o077)
    target = git(RELEASE, "rev-parse", "HEAD").decode().strip()
    head = git(PROD, "rev-parse", "HEAD").decode().strip()
    if head not in (base, target):
        raise RuntimeError("La revisión en producción cambió. Revisa antes de actualizar.")
    run("git", "-C", str(PROD), "merge-base", "--is-ancestor", base, target)
    incoming = paths(git(PROD, "diff", "--no-renames", "--name-only", "-z", base, target))
    local = paths(git(PROD, "diff", "--no-renames", "--name-only", "-z", "HEAD"))
    local |= paths(git(PROD, "ls-files", "--others", "--exclude-standard", "-z"))
    if incoming & local:
        raise RuntimeError("La actualización coincide con cambios locales. Se detuvo antes de modificar el servidor.")
    env_path = PROD / ".env"
    if env_path.is_symlink() or not env_path.is_file():
        raise RuntimeError("Se esperaba un archivo .env local en /opt/sigetic.")
    values = {}
    if plantilla:
        print("Se actualizarán el encabezado y el pie del TH-F-122.")
        if input("Escribe PUBLICAR para respaldar y actualizar SIGETIC: ").strip() != "PUBLICAR":
            print("Publicación cancelada.")
            return
    else:
        source = run("docker", "inspect", "--format", "{{json .Config.Env}}", "sigetic-api-1",
                     stdout=subprocess.PIPE, text=True).stdout
        settings = dict(item.split("=", 1) for item in json.loads(source) if "=" in item)
        address = settings.get("Email__SmtpUser", "").strip()
        if not re.fullmatch(r"[A-Za-z0-9._+%-]+@(gmail|googlemail)\.com", address, flags=re.I):
            raise RuntimeError("No se encontró la cuenta Gmail esperada en producción.")
        print(f"Se publicará el módulo de firmas con {address[:2]}***@{address.split('@')[-1]}.")
        if input("Escribe PUBLICAR para respaldar y actualizar SIGETIC: ").strip() != "PUBLICAR":
            print("Publicación cancelada.")
            return
        secret = "".join(getpass.getpass("Contraseña de aplicación que funcionó en el piloto: ").split())
        if not re.fullmatch(r"[A-Za-z0-9]{16}", secret):
            raise RuntimeError("La contraseña de aplicación debe tener 16 caracteres.")

        values = {
            "FIRMAS_PROVEEDOR_CORREO": "Gmail",
            "FIRMAS_REMITENTE": address,
            "FIRMAS_GMAIL_CLAVE_APLICACION": secret,
        }

    backup = Path(tempfile.mkdtemp(prefix="antes-firmas-", dir="/var/backups"))
    print(f"Respaldo: {backup}", flush=True)
    shutil.copyfile(env_path, backup / "entorno.env")
    (backup / "cambios-locales.patch").write_bytes(git(PROD, "diff", "--binary", "HEAD"))
    (backup / "revision.txt").write_text(head + "\n", encoding="utf-8")
    with (backup / "sigetic.dump").open("wb") as output:
        compose("exec", "-T", "db", "sh", "-ec", 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc',
                stdout=output)
    with (backup / "sigetic.dump").open("rb") as dump:
        compose("exec", "-T", "db", "pg_restore", "-l", stdin=dump, stdout=subprocess.DEVNULL)
    print("Respaldo PostgreSQL verificado.", flush=True)
    run("git", "-C", str(PROD), "merge", "--ff-only", target)
    compose("build", "api", "web")

    if values:
        lines = env_path.read_text(encoding="utf-8").splitlines()
        original_stat = env_path.stat()
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=PROD, prefix=".firmas-", delete=False) as out:
            name = Path(out.name)
            for line in lines:
                key = line.split("=", 1)[0].strip().removeprefix("export ").strip()
                if key not in values:
                    out.write(line + "\n")
            for key, value in values.items():
                out.write(f"{key}={value}\n")
            os.fchown(out.fileno(), original_stat.st_uid, original_stat.st_gid)
        name.replace(env_path)
    compose("up", "-d", "--no-deps", "--no-build", "api", "web")

    check = """Promise.all(['/api/health','/documentos-firma'].map(
      path=>fetch('http://127.0.0.1:3000'+path))).then(
      responses=>{if(responses.some(r=>!r.ok))process.exit(1)}).catch(()=>process.exit(1));"""
    for _ in range(30):
        try:
            compose("exec", "-T", "web", "node", "-e", check,
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=8)
            break
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
            time.sleep(3)
    else:
        raise RuntimeError("La interfaz o la API no respondió tras el cambio. Revisa los contenedores antes de continuar.")

    compose("exec", "-T", "db", "sh", "-ec",
            """psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c 'SELECT 1 FROM documentos_firma LIMIT 0'""",
            stdout=subprocess.DEVNULL)
    print("SIGETIC ACTUALIZADO: interfaz, API y tabla de firmas disponibles.")


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(f"PUBLICACION INCOMPLETA: falló un comando (salida {error.returncode}).") from None
    except (RuntimeError, OSError, ValueError) as error:
        raise SystemExit(f"PUBLICACION INCOMPLETA: {error}") from None
