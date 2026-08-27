namespace SIGETIC.Application.Equipos;

public sealed record CrearInventarioDeteccionResponse(
    Guid Id,
    string Token,
    DateTime ExpiraUtc
);

public sealed record DiscoInventarioDetectadoRequest(
    string? Modelo,
    long CapacidadBytes,
    string? Tipo
);

public sealed record ReportarInventarioDeteccionRequest(
    string? NombreEquipo,
    string? Fabricante,
    string? Modelo,
    string? Serial,
    string? UuidHardware,
    string? TipoEquipo,
    string? Procesador,
    decimal MemoriaRamGb,
    IReadOnlyList<DiscoInventarioDetectadoRequest>? Discos,
    string? SistemaOperativo,
    string? VersionSistemaOperativo,
    string? Arquitectura,
    string? DireccionIp,
    string? DireccionMac,
    string? UsuarioActual,
    string? BiosVersion,
    string? FechaInstalacion
);

public sealed record EstadoInventarioDeteccionResponse(
    Guid Id,
    string Estado,
    DateTime ExpiraUtc,
    DateTime? FechaRecepcionUtc,
    ReportarInventarioDeteccionRequest? Datos,
    Guid? EquipoExistenteId
);
