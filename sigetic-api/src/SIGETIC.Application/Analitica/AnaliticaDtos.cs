namespace SIGETIC.Application.Analitica;

public sealed record AnaliticaResumenResponse(
    IReadOnlyList<ConsumoDependenciaResponse> ConsumoPorDependencia,
    IReadOnlyList<PresupuestoConsumibleResponse> PresupuestoConsumibles,
    IReadOnlyList<AlertaStockResponse> AlertasStock,
    IReadOnlyList<CalendarioMantenimientoResponse> Calendario,
    IReadOnlyList<SemaforoActivoResponse> SemaforoActivos,
    SatisfaccionTicketsResponse SatisfaccionTickets
);

public sealed record ConsumoDependenciaResponse(
    string Dependencia,
    int Tickets,
    int Mantenimientos,
    int Consumibles,
    decimal CostoConsumibles
);

public sealed record PresupuestoConsumibleResponse(
    string Mes,
    string TipoMovimiento,
    int Cantidad,
    decimal Total
);

public sealed record AlertaStockResponse(
    string Codigo,
    string Nombre,
    string Tipo,
    int StockActual,
    int StockMinimo,
    string Severidad
);

public sealed record CalendarioMantenimientoResponse(
    string TipoActivo,
    string Codigo,
    string Nombre,
    string Dependencia,
    DateOnly Fecha,
    string TipoMantenimiento,
    string Estado
);

public sealed record SemaforoActivoResponse(
    string TipoActivo,
    string Codigo,
    string Nombre,
    string Dependencia,
    string Estado,
    string Color,
    string Motivo
);

public sealed record SatisfaccionTicketsResponse(
    int Encuestas,
    decimal PromedioGeneral,
    decimal PromedioTiempo,
    decimal PromedioAtencion,
    decimal PromedioAmabilidad,
    decimal PromedioSolucion
);

public sealed record HistorialConsolidadoResponse(
    string Codigo,
    string Nombre,
    string TipoActivo,
    IReadOnlyList<HistorialConsolidadoItemResponse> Eventos
);

public sealed record HistorialConsolidadoItemResponse(
    DateOnly Fecha,
    string Tipo,
    string Titulo,
    string Detalle,
    string Responsable
);
