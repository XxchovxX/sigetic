# SIGETIC - Producción local/intranet

Esta guía deja SIGETIC listo para operar en un equipo servidor dentro de la red interna.

## 1. Opción recomendada de servidor

Para este caso, la opción más simple y suficiente es:

- Equipo Windows dedicado o semidedicado dentro de la Alcaldía.
- IP fija en la red local: `192.168.1.34`.
- PostgreSQL local o en servidor de base de datos interno.
- API SIGETIC en puerto `5032`.
- Web SIGETIC en puerto `3000`.
- Acceso inicial: `http://192.168.1.34:3000/login`.

Más adelante se puede usar un nombre interno:

- `http://sigetic.local:3000/login`
- `http://sigetic.alcaldia.local:3000/login`

Ese nombre se define en DNS interno del router/servidor o en el archivo `hosts` de los equipos clientes.

## 2. Archivos de producción

Backend:

- `sigetic-api/src/SIGETIC.Api/appsettings.Production.json`
- `sigetic-api/src/SIGETIC.Api/appsettings.Production.example.json`

Frontend:

- `sigetic-web/.env.production`
- `sigetic-web/.env.production.example`

La cadena real del backend es:

```json
"ConnectionStrings": {
  "SigeticDatabase": "Host=localhost;Port=5432;Database=sigetic_db;Username=postgres;Password=postgres"
}
```

Antes de producción definitiva, cambiar `Username=postgres;Password=postgres` por un usuario propio de la aplicación.

## 3. Publicar

Desde PowerShell:

```powershell
cd D:\mesadeayuda
.\scripts\production\Publish-Sigetic.ps1
```

Esto genera:

- `D:\sigetic-publish\api`
- `D:\sigetic-publish\web`

## 4. Iniciar producción

```powershell
cd D:\mesadeayuda
.\scripts\production\Start-SigeticProduction.ps1
```

Validar:

- API: `http://localhost:5032/api/health`
- Web: `http://localhost:3000/login`
- Red interna: `http://192.168.1.34:3000/login`

## 5. Detener

```powershell
cd D:\mesadeayuda
.\scripts\production\Stop-Sigetic.ps1
```

## 6. Prueba automática

```powershell
cd D:\mesadeayuda
.\scripts\production\Test-SigeticProduction.ps1
```

La prueba valida:

- API health.
- Login web.
- Endpoints privados sin token responden `401`.
- Administrador puede acceder a administración.
- Secretario SAF no puede administrar usuarios.
- Secretario SAF sí puede ver analítica.
- Auxiliar SAF sí puede ver consumibles.
- Auxiliar SAF no puede ver dashboard.

## 7. Arranque automático

Cuando el equipo quede como servidor, registrar tarea de inicio:

```powershell
cd D:\mesadeayuda
.\scripts\production\Register-SigeticStartupTask.ps1
```

Esto crea una tarea en el Programador de tareas de Windows para iniciar API y web al arrancar el equipo.

## 8. Firewall

Abrir solo los puertos necesarios en la red interna:

```powershell
New-NetFirewallRule -DisplayName "SIGETIC Web 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
New-NetFirewallRule -DisplayName "SIGETIC API 5032" -Direction Inbound -Protocol TCP -LocalPort 5032 -Action Allow
```

Si el frontend usa el proxy interno, los usuarios solo necesitan acceder al puerto `3000`.

## 9. Base de datos y respaldos

Crear usuario propio para producción:

```sql
CREATE USER sigetic_app WITH PASSWORD 'CAMBIAR_PASSWORD_SEGURO';
GRANT CONNECT ON DATABASE sigetic_db TO sigetic_app;
GRANT USAGE ON SCHEMA public TO sigetic_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sigetic_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sigetic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sigetic_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sigetic_app;
```

Crear respaldo:

```powershell
pg_dump -h localhost -U sigetic_app -d sigetic_db -Fc -f D:\backups\sigetic_$(Get-Date -Format yyyyMMdd_HHmm).dump
```

Restaurar respaldo:

```powershell
pg_restore -h localhost -U sigetic_app -d sigetic_db -c D:\backups\sigetic_FECHA.dump
```

## 10. Seguridad antes de salida real

- Cambiar todas las contraseñas de prueba.
- Crear usuarios reales por dependencia.
- Revisar roles de cada usuario.
- Mantener privada la llave `Jwt:SecretKey`.
- No publicar `appsettings.Production.json` en repositorios.
- Hacer respaldo diario de PostgreSQL.
- Probar restauración de respaldo.
- Usar HTTPS si se publica fuera de la red local.
- Restringir PostgreSQL para que no quede abierto a toda la red.
- Registrar responsable interno del sistema y procedimiento de soporte.
