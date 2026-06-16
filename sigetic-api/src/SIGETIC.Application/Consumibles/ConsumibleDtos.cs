namespace SIGETIC.Application.Consumibles;

public sealed record CrearConsumibleRequest(
    string CodigoInterno,
    string Nombre,
    string TipoConsumible,
    string Referencia,
    string Color,
    string UnidadMedida,
    int StockActual,
    int StockMinimo,
    decimal CostoUnitario,
    string? MarcaCompatible,
    string? ModelosCompatibles,
    string? Observaciones
);

public sealed record ActualizarConsumibleRequest(
    string CodigoInterno,
    string Nombre,
    string TipoConsumible,
    string Referencia,
    string Color,
    string UnidadMedida,
    int StockMinimo,
    decimal CostoUnitario,
    string? MarcaCompatible,
    string? ModelosCompatibles,
    string? Observaciones,
    bool Activo
);

public sealed record ConsumibleResponse(
    Guid Id,
    string CodigoInterno,
    string Nombre,
    string TipoConsumible,
    string Referencia,
    string Color,
    string UnidadMedida,
    int StockActual,
    int StockMinimo,
    decimal CostoUnitario,
    bool BajoStock,
    string? MarcaCompatible,
    string? ModelosCompatibles,
    string? Observaciones,
    bool Activo,
    DateTime FechaCreacionUtc,
    DateTime? FechaActualizacionUtc
);

public sealed record CrearMovimientoConsumibleRequest(
    DateOnly FechaMovimiento,
    string TipoMovimiento,
    int Cantidad,
    string Responsable,
    string? Destino,
    Guid? DependenciaId,
    Guid? ImpresoraId,
    string? DocumentoSoporte,
    string? Observaciones,
    decimal? CostoUnitario
);

public sealed record MovimientoConsumibleResponse(
    Guid Id,
    Guid ConsumibleId,
    DateOnly FechaMovimiento,
    string TipoMovimiento,
    int Cantidad,
    string Responsable,
    string? Destino,
    Guid? DependenciaId,
    string? Dependencia,
    Guid? ImpresoraId,
    string? Impresora,
    string? DocumentoSoporte,
    string? Observaciones,
    int StockResultante,
    decimal CostoUnitario,
    decimal CostoTotal,
    DateTime FechaCreacionUtc
);
