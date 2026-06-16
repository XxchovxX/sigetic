# SIGETIC en Render Free

Esta es la alternativa para probar SIGETIC en una web real cuando Oracle Cloud no permite crear la cuenta.

## Veredicto

Render sirve para una prueba publica rapida porque permite:

- Desplegar desde GitHub.
- HTTPS automatico.
- Un servicio Docker para el API.
- Un servicio Docker para el frontend.
- Una base de datos PostgreSQL administrada.

Pero el plan gratis debe tratarse como ambiente de prueba. No se debe usar como produccion oficial con datos reales permanentes.

## Arquitectura

El archivo `render.yaml` crea:

- `sigetic-db`: PostgreSQL.
- `sigetic-api-san-carlos`: API ASP.NET Core.
- `sigetic-web-san-carlos`: frontend Next.js.

URLs esperadas:

```text
https://sigetic-web-san-carlos.onrender.com/login
https://sigetic-api-san-carlos.onrender.com/api/health
```

Si Render cambia el nombre por disponibilidad, hay que actualizar estas variables:

- `Cors__AllowedOrigins__0` en el API.
- `NEXT_PUBLIC_API_URL` en el web.
- `SIGETIC_INTERNAL_API_URL` en el web.

## Paso a paso

### 1. Subir el proyecto a GitHub

Crear un repositorio privado y subir la carpeta `D:\mesadeayuda`.

No subir archivos con secretos reales, especialmente:

- `sigetic-api/src/SIGETIC.Api/appsettings.Production.json`
- `sigetic-web/.env.production`
- `.env`

### 2. Crear cuenta en Render

Entrar a:

```text
https://render.com
```

Registrarse con GitHub.

### 3. Crear Blueprint

En Render:

1. Ir a `New`.
2. Elegir `Blueprint`.
3. Conectar el repositorio de SIGETIC.
4. Render detecta el archivo `render.yaml`.
5. Confirmar la creacion de los servicios.

### 4. Esperar el despliegue

Render construira:

1. Base de datos.
2. API.
3. Frontend.

La primera construccion puede tardar varios minutos.

### 5. Validar API

Abrir:

```text
https://sigetic-api-san-carlos.onrender.com/api/health
```

Debe responder `OK`.

### 6. Validar web

Abrir:

```text
https://sigetic-web-san-carlos.onrender.com/login
```

Probar login con el usuario administrador.

### 7. Validar flujo completo

Probar:

- Login.
- Dashboard.
- Mesa de ayuda.
- Crear ticket.
- Atender ticket.
- Encuesta de satisfaccion.
- Consumibles.
- Equipos.
- Impresoras.
- Informes.
- Exportaciones.
- Roles.

## Advertencias

- Los servicios gratis pueden dormir si no reciben trafico.
- La primera carga puede tardar.
- La base de datos gratuita no debe usarse como respaldo oficial de informacion.
- Para produccion final se recomienda plan pago con backups o VPS economico.

## Notificaciones por correo

SIGETIC puede enviar correos cuando:

- Se crea un ticket.
- Se actualiza el estado de un ticket.

En Render se configuran variables de entorno en el servicio `sigetic-api-san-carlos`:

```text
Email__Enabled=true
Email__SmtpHost=smtp.proveedor.com
Email__SmtpPort=587
Email__SmtpUser=USUARIO_SMTP
Email__SmtpPassword=PASSWORD_SMTP
Email__FromAddress=sigetic@dominio.com
Email__FromName=SIGETIC
Email__EnableSsl=true
Email__TicketRecipients=admin@correo.com,tecnico@correo.com
```

No se deben subir credenciales SMTP a GitHub. Deben quedar solo en las variables de entorno de Render.

## Siguiente paso despues de validar

Si Render funciona bien para la prueba, hay dos caminos:

1. Mantener Render pero pasar a planes pagos con PostgreSQL persistente y backups.
2. Migrar a un VPS economico con Docker Compose, dominio institucional y backups diarios.
