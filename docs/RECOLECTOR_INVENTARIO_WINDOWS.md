# Recolector de inventario para Windows

SIGETIC permite diligenciar automaticamente la informacion tecnica de computadores
con Windows 10 y Windows 11 antes de crear su ficha de inventario.

## Flujo de uso

1. Ingresar con un perfil que tenga permiso de escritura sobre Inventario TIC.
2. Abrir `Inventario TIC > Registrar equipo`.
3. Seleccionar `Detectar este equipo`.
4. Abrir PowerShell y ejecutar el comando mostrado por SIGETIC.
5. Esperar la confirmacion y revisar los campos diligenciados.
6. Completar codigo interno, ubicacion, dependencia y funcionario asignado.
7. Guardar el equipo.

## Informacion recopilada

- Nombre, fabricante, modelo, serial y UUID del computador.
- Tipo de equipo segun el chasis: escritorio, portatil o servidor.
- Procesador y memoria RAM instalada.
- Discos internos y capacidad. Las unidades USB se excluyen.
- Edicion, version y arquitectura de Windows.
- Direccion IPv4, MAC, version de BIOS y usuario conectado.
- Fecha de instalacion del sistema operativo cuando Windows la suministra.

El recolector no accede a archivos personales, contrasenas, historial de navegacion,
claves de producto ni redes Wi-Fi guardadas.

## Seguridad

- Cada descarga usa un token aleatorio de 256 bits.
- En la base de datos solo se conserva el hash SHA-256 del token.
- La vinculacion vence despues de 20 minutos.
- El token solo admite una recepcion, incluso ante solicitudes simultaneas.
- La captura pertenece al usuario que la creo y otro usuario no puede consultarla.
- Antes de guardar, SIGETIC comprueba si el serial ya pertenece a otro equipo.

## Prueba sin envio

El archivo base puede probarse localmente sin transmitir informacion:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\SIGETIC-Detectar-Equipo.ps1 -SoloVistaPrevia
```

## Despliegue

La migracion `AddInventoryDetectionSessions` se aplica automaticamente al iniciar la
API cuando `Database__ApplyMigrationsOnStartup` esta habilitado. No requiere nuevas
variables de entorno.
