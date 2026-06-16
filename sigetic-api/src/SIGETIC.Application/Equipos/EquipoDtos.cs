namespace SIGETIC.Application.Equipos;

public sealed record CrearEquipoRequest(
    string CodigoInterno,
    string TipoEquipo,
    string Marca,
    string Modelo,
    string Serial,
    string Dependencia,
    string FuncionarioAsignado,
    string Estado,
    string Procesador,
    string MemoriaRam,
    string Almacenamiento,
    string SistemaOperativo,
    string? DireccionIp,
    string? DireccionMac,
    string UbicacionFisica,
    DateOnly FechaIngreso,
    string? Observaciones
);

public sealed record ActualizarEquipoRequest(
    string CodigoInterno,
    string TipoEquipo,
    string Marca,
    string Modelo,
    string Serial,
    string Dependencia,
    string FuncionarioAsignado,
    string Estado,
    string Procesador,
    string MemoriaRam,
    string Almacenamiento,
    string SistemaOperativo,
    string? DireccionIp,
    string? DireccionMac,
    string UbicacionFisica,
    DateOnly FechaIngreso,
    string? Observaciones
);

public sealed record EquipoResponse(
    Guid Id,
    string CodigoInterno,
    string TipoEquipo,
    string Marca,
    string Modelo,
    string Serial,
    string Dependencia,
    string FuncionarioAsignado,
    string Estado,
    string Procesador,
    string MemoriaRam,
    string Almacenamiento,
    string SistemaOperativo,
    string? DireccionIp,
    string? DireccionMac,
    string UbicacionFisica,
    DateOnly FechaIngreso,
    string? Observaciones,
    DateTime FechaCreacionUtc
);