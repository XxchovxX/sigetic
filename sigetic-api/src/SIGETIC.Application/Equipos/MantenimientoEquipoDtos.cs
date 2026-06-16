namespace SIGETIC.Application.Equipos;

public sealed record CrearMantenimientoEquipoRequest(
    string TipoMantenimiento,
    DateOnly FechaMantenimiento,
    string TecnicoResponsable,
    string Diagnostico,
    string ActividadesRealizadas,
    string? RepuestosUtilizados,
    string EstadoResultante,
    DateOnly? ProximaRevision,
    string? Observaciones,
    string? FirmaTecnico,
    string? FirmaRecibe,
    string? NombreRecibe,
    string? DocumentoRecibe
);

public sealed record MantenimientoEquipoResponse(
    Guid Id,
    Guid EquipoId,
    string TipoMantenimiento,
    DateOnly FechaMantenimiento,
    string TecnicoResponsable,
    string Diagnostico,
    string ActividadesRealizadas,
    string? RepuestosUtilizados,
    string EstadoResultante,
    DateOnly? ProximaRevision,
    string? Observaciones,
    string? FirmaTecnico,
    string? FirmaRecibe,
    string? NombreRecibe,
    string? DocumentoRecibe,
    DateTime? FechaFirmaUtc,
    DateTime FechaCreacionUtc
);
