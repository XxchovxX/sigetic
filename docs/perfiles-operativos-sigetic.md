# Perfiles operativos SIGETIC

## Perfil recomendado para soporte y mantenimientos

Para el personal que ejecuta mantenimientos, atiende tickets, registra equipos, impresoras, consumibles y programaciones preventivas, use el rol:

**Tecnico TIC**

Este rol aplica para el tecnico de sistemas, contratistas TIC o personal de apoyo que deba operar el sistema sin tener permisos de administracion general.

## Cuando usar cada perfil

**Administrador**

Uso exclusivo para administracion general de SIGETIC. Puede crear, modificar y eliminar usuarios, administrar configuracion y acceder a todos los modulos.

**Administrador TIC**

Uso para el responsable TIC que coordina inventario, mantenimientos, impresoras, consumibles, reportes y mesa de ayuda.

**Tecnico TIC**

Uso para Maron, contratistas o apoyo tecnico. Puede operar inventario TIC, impresoras, consumibles, mesa de ayuda, programacion de mantenimientos preventivos, reportes y analitica operativa. No puede administrar usuarios ni roles.

**Auxiliar Administrativo SAF**

Uso para apoyo administrativo de la Secretaria Administrativa Financiera. Gestiona consumibles y puede crear tickets.

**Secretario Administrativo Financiero**

Uso directivo. Visualiza dashboard, reportes, analitica, mesa de ayuda y consumibles.

**Funcionario**

Uso general. Puede crear tickets y revisar su mesa de ayuda.

## Como crear el usuario del tecnico

1. Ingresar con un usuario Administrador.
2. Ir a Configuracion.
3. En Crear acceso al sistema, registrar:
   - Nombre completo.
   - Correo.
   - Contrasena temporal.
   - Rol: Tecnico TIC.
4. Guardar.
5. Entregar la contrasena temporal y pedir cambio posterior desde Configuracion si aplica.

## Como queda documentada cada accion

SIGETIC registra auditoria automatica de operaciones realizadas desde la API:

- Usuario que hizo la accion.
- Rol del usuario.
- Modulo afectado.
- Accion realizada.
- Fecha y hora UTC.
- Ruta de la solicitud.
- Resumen del cambio, evitando campos sensibles.

Por eso, si Cristian ingresa con un usuario propio de Tecnico TIC, las acciones quedan asociadas a su usuario y no mezcladas con el administrador general.

## Nota sobre correos compartidos

El correo se usa como canal de acceso y notificacion, pero para trazabilidad operativa se debe crear un usuario por persona siempre que sea posible. Si varias personas comparten correo institucional, use correos personales autorizados o cuentas internas diferenciadas para evitar que las acciones queden mezcladas.
