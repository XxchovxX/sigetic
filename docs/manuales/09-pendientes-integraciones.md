# Integraciones Y Controles Pendientes

Este documento separa lo que ya está operativo de lo que debe parametrizarse o fortalecerse antes de una puesta en producción definitiva.

## 1. Notificaciones Por Correo

Estado: pendiente de parametrización.

Requisito:

- Definir correo remitente SMTP.
- Definir correo del técnico responsable.
- Definir correo del administrador que recibirá copia.
- Configurar variables de entorno:
  - `EMAIL_ENABLED`
  - `EMAIL_SMTP_HOST`
  - `EMAIL_SMTP_PORT`
  - `EMAIL_SMTP_USER`
  - `EMAIL_SMTP_PASSWORD`
  - `EMAIL_FROM_ADDRESS`
  - `EMAIL_FROM_NAME`
  - `EMAIL_TICKET_RECIPIENTS`

Uso esperado:

- Enviar notificación cuando se cree un ticket.
- Enviar notificación cuando un ticket cambie de estado.
- Enviar notificación cuando el stock de consumibles llegue a nivel bajo.

## 2. Dominio Oficial

Estado: pendiente de decisión institucional.

Opciones:

- Usar dominio institucional si la Alcaldía lo autoriza.
- Usar subdominio técnico administrado temporalmente.
- Mantener `sslip.io` solo para pruebas, no como URL final institucional.

## 3. Copias De Seguridad

Estado: recomendado antes de producción estable.

Acciones sugeridas:

- Programar respaldo diario de PostgreSQL.
- Guardar respaldo fuera del servidor.
- Probar restauración al menos una vez al mes.

## 4. Certificado HTTPS Definitivo

Estado: operativo con Caddy en dominio público, pero depende del dominio final.

Cuando exista dominio oficial, Caddy debe emitir el certificado para ese dominio y redirigir tráfico HTTP a HTTPS.

## 5. Manuales En PDF O Word

Estado: documentos base creados en Markdown.

Siguiente paso:

- Convertir estos manuales a PDF o Word institucional.
- Agregar portada, logo oficial, versión, responsable y control de cambios.

## 6. Política De Firma Electrónica Interna

Estado: funcional en el sistema.

Pendiente:

- Definir una nota institucional que indique que la firma escaneada o digitada es válida para trazabilidad interna.
- Aclarar que no equivale a firma digital certificada.

## 7. Monitoreo Del Servidor

Estado: recomendado.

Acciones:

- Revisar uso de disco.
- Revisar estado de contenedores Docker.
- Revisar renovación de certificados.
- Revisar logs de API ante errores.

