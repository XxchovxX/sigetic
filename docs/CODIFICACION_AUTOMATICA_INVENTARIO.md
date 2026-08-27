# Codificacion automatica del inventario TIC

SIGETIC asigna el codigo institucional al guardar un equipo. El tecnico no debe escribir ni calcular consecutivos manualmente.

## Estructura

`TIPO-ALC-DEPENDENCIA-CONSECUTIVO`

Ejemplos:

- `PC-ALC-PLA-001`: computador de escritorio de la Secretaria de Planeacion.
- `PT-ALC-SAF-001`: portatil de la Secretaria Administrativa y Financiera.
- `SRV-ALC-SIS-001`: servidor de Sistemas.

Los segmentos de tipo son `PC`, `PT`, `SRV`, `MON`, `SW`, `RTR`, `AP`, `UPS` y `EQ`. El segmento de dependencia sale del catalogo administrado en SIGETIC, por ejemplo `PLA`, `SIS`, `SAF`, `SAL` o `GOB`.

## Flujo de registro

1. El recolector de Windows obtiene exclusivamente la informacion tecnica del computador.
2. El tecnico revisa los datos y selecciona la dependencia activa en SIGETIC.
3. El formulario muestra una vista previa del siguiente codigo disponible.
4. Al guardar, la API reserva el consecutivo dentro de una transaccion y confirma el codigo definitivo.

La base de datos mantiene un indice unico y una secuencia independiente por tipo y dependencia. Dos registros simultaneos no pueden recibir el mismo codigo.

## Regla de permanencia

El codigo identifica la hoja de vida del activo y no cambia automaticamente cuando el equipo se traslada o se reasigna. El traslado se documenta mediante la dependencia, la ubicacion y los registros de seguimiento; esto conserva la trazabilidad historica del activo.
