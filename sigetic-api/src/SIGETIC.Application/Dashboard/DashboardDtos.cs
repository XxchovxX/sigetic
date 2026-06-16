namespace SIGETIC.Application.Dashboard;

public sealed record DashboardResumenResponse(
    int TotalEquipos,
    int EquiposActivos,
    int EquiposEnMantenimiento,
    int TotalImpresoras,
    int ImpresorasActivas,
    int ConsumiblesBajoStock,
    int TicketsAbiertos,
    int TicketsEnProceso,
    IReadOnlyList<DashboardActividadResponse> UltimosMovimientosConsumibles,
    IReadOnlyList<DashboardActividadResponse> UltimosMantenimientos,
    IReadOnlyList<DashboardActividadResponse> UltimosTickets
);

public sealed record DashboardActividadResponse(
    string Fecha,
    string Titulo,
    string Detalle,
    string Estado
);
