using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Dashboard;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class DashboardService : IDashboardService
{
    private readonly SigeticDbContext _dbContext;

    public DashboardService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DashboardResumenResponse> GetResumenAsync(
        CancellationToken cancellationToken)
    {
        var totalEquipos = await _dbContext.Equipos.CountAsync(cancellationToken);
        var equiposActivos = await _dbContext.Equipos
            .CountAsync(e => EF.Functions.ILike(e.Estado, "%activo%"), cancellationToken);
        var equiposEnMantenimiento = await _dbContext.Equipos
            .CountAsync(e => EF.Functions.ILike(e.Estado, "%mantenimiento%"), cancellationToken);

        var totalImpresoras = await _dbContext.Impresoras.CountAsync(cancellationToken);
        var impresorasActivas = await _dbContext.Impresoras
            .CountAsync(e => EF.Functions.ILike(e.Estado, "%activa%"), cancellationToken);

        var consumiblesBajoStock = await _dbContext.Consumibles
            .CountAsync(e => e.Activo && e.StockActual <= e.StockMinimo, cancellationToken);

        var ticketsAbiertos = await _dbContext.TicketsMesaAyuda
            .CountAsync(
                e => !EF.Functions.ILike(e.Estado, "%cerrado%") &&
                     !EF.Functions.ILike(e.Estado, "%resuelto%"),
                cancellationToken);

        var ticketsEnProceso = await _dbContext.TicketsMesaAyuda
            .CountAsync(e => EF.Functions.ILike(e.Estado, "%proceso%"), cancellationToken);

        var movimientos = await _dbContext.MovimientosConsumibles
            .AsNoTracking()
            .Include(e => e.Consumible)
            .OrderByDescending(e => e.FechaMovimiento)
            .ThenByDescending(e => e.FechaCreacionUtc)
            .Take(5)
            .Select(e => new DashboardActividadResponse(
                e.FechaMovimiento.ToString("yyyy-MM-dd"),
                $"{e.TipoMovimiento} de {e.Consumible!.Nombre}",
                $"{e.Cantidad} unidad(es). Stock resultante: {e.StockResultante}",
                e.TipoMovimiento))
            .ToListAsync(cancellationToken);

        var mantenimientosEquipo = await _dbContext.MantenimientosEquipo
            .AsNoTracking()
            .OrderByDescending(e => e.FechaMantenimiento)
            .Take(3)
            .Select(e => new DashboardActividadResponse(
                e.FechaMantenimiento.ToString("yyyy-MM-dd"),
                $"Equipo - {e.TipoMantenimiento}",
                e.ActividadesRealizadas,
                e.EstadoResultante))
            .ToListAsync(cancellationToken);

        var mantenimientosImpresora = await _dbContext.MantenimientosImpresora
            .AsNoTracking()
            .OrderByDescending(e => e.FechaMantenimiento)
            .Take(3)
            .Select(e => new DashboardActividadResponse(
                e.FechaMantenimiento.ToString("yyyy-MM-dd"),
                $"Impresora - {e.TipoMantenimiento}",
                e.ActividadesRealizadas,
                e.EstadoResultante))
            .ToListAsync(cancellationToken);

        var mantenimientos = mantenimientosEquipo
            .Concat(mantenimientosImpresora)
            .OrderByDescending(e => e.Fecha)
            .Take(5)
            .ToList();

        var ultimosTickets = await _dbContext.TicketsMesaAyuda
            .AsNoTracking()
            .OrderByDescending(e => e.FechaSolicitud)
            .ThenByDescending(e => e.FechaCreacionUtc)
            .Take(5)
            .Select(e => new DashboardActividadResponse(
                e.FechaSolicitud.ToString("yyyy-MM-dd"),
                $"{e.Codigo} - {e.Categoria}",
                $"{e.Solicitante} / {e.Dependencia}",
                e.Estado))
            .ToListAsync(cancellationToken);

        return new DashboardResumenResponse(
            totalEquipos,
            equiposActivos,
            equiposEnMantenimiento,
            totalImpresoras,
            impresorasActivas,
            consumiblesBajoStock,
            ticketsAbiertos,
            ticketsEnProceso,
            movimientos,
            mantenimientos,
            ultimosTickets);
    }
}
