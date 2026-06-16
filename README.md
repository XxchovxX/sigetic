# SIGETIC

Sistema Integral de Gestion TIC para la Alcaldia de San Carlos de Guaroa.

SIGETIC centraliza la mesa de ayuda, inventario tecnologico, hojas de vida de equipos, impresoras, consumibles, mantenimientos, reportes y analitica institucional.

## Modulos principales

- Dashboard institucional.
- Mesa de ayuda y tickets.
- Inventario de equipos TIC.
- Hojas de vida de equipos.
- Impresoras y mantenimientos.
- Consumibles y control de stock.
- Analitica, presupuestos y alertas.
- Reportes PDF y Excel.
- Administracion de usuarios, roles, dependencias y funcionarios.

## Estructura del proyecto

```text
sigetic-api/   API ASP.NET Core con PostgreSQL
sigetic-web/   Frontend Next.js
render.yaml    Despliegue en Render
deploy/        Archivos de despliegue web con Docker/Caddy
scripts/       Scripts de produccion local
```

## Desarrollo local

API:

```powershell
cd sigetic-api
dotnet run --project src/SIGETIC.Api/SIGETIC.Api.csproj
```

Frontend:

```powershell
cd sigetic-web
npm install
npm run dev
```

## Despliegue de prueba en Render

El archivo `render.yaml` crea:

- Base de datos PostgreSQL.
- Servicio web para la API.
- Servicio web para el frontend.

Ver guia detallada en:

```text
DEPLOYMENT_RENDER_FREE.md
```

## Seguridad

No se deben subir archivos con secretos reales:

- `.env`
- `.env.production`
- `appsettings.Production.json`

Los ejemplos seguros se mantienen como referencia:

- `.env.web.example`
- `appsettings.Production.example.json`

