namespace SIGETIC.Application.Impresoras;

public sealed record CrearImpresoraRequest(
    string CodigoInterno,
    string Marca,
    string Modelo,
    string Serial,
    string TipoImpresora,
    string TecnologiaImpresion,
    Guid DependenciaId,
    Guid? FuncionarioAsignadoId,
    string Estado,
    string UbicacionFisica,
    string? DireccionIp,
    string? DireccionMac,
    DateOnly FechaIngreso,
    string? Observaciones
);

public sealed record ActualizarImpresoraRequest(
    string CodigoInterno,
    string Marca,
    string Modelo,
    string Serial,
    string TipoImpresora,
    string TecnologiaImpresion,
    Guid DependenciaId,
    Guid? FuncionarioAsignadoId,
    string Estado,
    string UbicacionFisica,
    string? DireccionIp,
    string? DireccionMac,
    DateOnly FechaIngreso,
    string? Observaciones
);

public sealed record ImpresoraResponse(
    Guid Id,
    string CodigoInterno,
    string Marca,
    string Modelo,
    string Serial,
    string TipoImpresora,
    string TecnologiaImpresion,
    Guid DependenciaId,
    string Dependencia,
    Guid? FuncionarioAsignadoId,
    string? FuncionarioAsignado,
    string Estado,
    string UbicacionFisica,
    string? DireccionIp,
    string? DireccionMac,
    DateOnly FechaIngreso,
    string? Observaciones,
    DateTime FechaCreacionUtc
);

public sealed record CrearMantenimientoImpresoraRequest(
    string TipoMantenimiento,
    DateOnly FechaMantenimiento,
    string TecnicoResponsable,
    string Diagnostico,
    string ActividadesRealizadas,
    string? RepuestosUtilizados,
    int? ContadorPaginas,
    string EstadoResultante,
    DateOnly? ProximaRevision,
    string? Observaciones,
    string? FirmaTecnico,
    string? FirmaRecibe,
    string? NombreRecibe,
    string? DocumentoRecibe
);

public sealed record MantenimientoImpresoraResponse(
    Guid Id,
    Guid ImpresoraId,
    string TipoMantenimiento,
    DateOnly FechaMantenimiento,
    string TecnicoResponsable,
    string Diagnostico,
    string ActividadesRealizadas,
    string? RepuestosUtilizados,
    int? ContadorPaginas,
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

public sealed record CrearHistorialConsumibleImpresoraRequest(
    DateOnly FechaMovimiento,
    string TipoMovimiento,
    string TipoConsumible,
    string Referencia,
    string Color,
    int Cantidad,
    string ResponsableEntrega,
    int? ContadorPaginas,
    string? Observaciones
);

public sealed record HistorialConsumibleImpresoraResponse(
    Guid Id,
    Guid ImpresoraId,
    DateOnly FechaMovimiento,
    string TipoMovimiento,
    string TipoConsumible,
    string Referencia,
    string Color,
    int Cantidad,
    string ResponsableEntrega,
    int? ContadorPaginas,
    string? Observaciones,
    DateTime FechaCreacionUtc
);
