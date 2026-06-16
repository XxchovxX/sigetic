using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Analitica;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class AnaliticaService : IAnaliticaService
{
    private readonly SigeticDbContext _dbContext;

    public AnaliticaService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AnaliticaResumenResponse> GetResumenAsync(
        CancellationToken cancellationToken)
    {
        var tickets = await _dbContext.TicketsMesaAyuda
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var equipos = await _dbContext.Equipos
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var impresoras = await _dbContext.Impresoras
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .ToListAsync(cancellationToken);

        var mantenimientosEquipo = await _dbContext.MantenimientosEquipo
            .AsNoTracking()
            .Include(e => e.Equipo)
            .ToListAsync(cancellationToken);

        var mantenimientosImpresora = await _dbContext.MantenimientosImpresora
            .AsNoTracking()
            .Include(e => e.Impresora)
            .ThenInclude(e => e!.Dependencia)
            .ToListAsync(cancellationToken);

        var movimientos = await _dbContext.MovimientosConsumibles
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Include(e => e.Impresora)
            .ThenInclude(e => e!.Dependencia)
            .ToListAsync(cancellationToken);

        var consumibles = await _dbContext.Consumibles
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var dependencias = tickets.Select(e => e.Dependencia)
            .Concat(equipos.Select(e => e.Dependencia))
            .Concat(impresoras.Select(e => e.Dependencia?.Nombre ?? "Sin dependencia"))
            .Concat(movimientos.Select(e => e.Dependencia?.Nombre ?? e.Impresora?.Dependencia?.Nombre ?? e.Destino ?? "Sin dependencia"))
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(e => e)
            .ToList();

        var consumoPorDependencia = dependencias
            .Select(dependencia => new ConsumoDependenciaResponse(
                dependencia,
                tickets.Count(e => Same(e.Dependencia, dependencia)),
                mantenimientosEquipo.Count(e => e.Equipo is not null && Same(e.Equipo.Dependencia, dependencia)) +
                    mantenimientosImpresora.Count(e => e.Impresora is not null && Same(e.Impresora.Dependencia?.Nombre, dependencia)),
                movimientos.Where(e => e.TipoMovimiento == "Salida")
                    .Where(e => Same(e.Dependencia?.Nombre, dependencia) ||
                        Same(e.Impresora?.Dependencia?.Nombre, dependencia) ||
                        Same(e.Destino, dependencia))
                    .Sum(e => e.Cantidad),
                movimientos.Where(e => e.TipoMovimiento == "Salida")
                    .Where(e => Same(e.Dependencia?.Nombre, dependencia) ||
                        Same(e.Impresora?.Dependencia?.Nombre, dependencia) ||
                        Same(e.Destino, dependencia))
                    .Sum(e => e.CostoTotal)))
            .OrderByDescending(e => e.Tickets + e.Mantenimientos + e.Consumibles)
            .Take(10)
            .ToList();

        var presupuesto = movimientos
            .GroupBy(e => new { Mes = e.FechaMovimiento.ToString("yyyy-MM"), e.TipoMovimiento })
            .Select(group => new PresupuestoConsumibleResponse(
                group.Key.Mes,
                group.Key.TipoMovimiento,
                group.Sum(e => e.Cantidad),
                group.Sum(e => e.CostoTotal)))
            .OrderByDescending(e => e.Mes)
            .ThenBy(e => e.TipoMovimiento)
            .Take(12)
            .ToList();

        var alertas = consumibles
            .Where(e => e.Activo && e.StockActual <= e.StockMinimo)
            .OrderBy(e => e.StockActual)
            .ThenBy(e => e.CodigoInterno)
            .Select(e => new AlertaStockResponse(
                e.CodigoInterno,
                e.Nombre,
                e.TipoConsumible,
                e.StockActual,
                e.StockMinimo,
                e.StockActual == 0 ? "Critica" : "Baja"))
            .ToList();

        var calendario = mantenimientosEquipo
            .Where(e => e.ProximaRevision is not null)
            .Select(e => new CalendarioMantenimientoResponse(
                "Equipo TIC",
                e.Equipo?.CodigoInterno ?? "",
                e.Equipo is null ? "Equipo" : $"{e.Equipo.Marca} {e.Equipo.Modelo}",
                e.Equipo?.Dependencia ?? "Sin dependencia",
                e.ProximaRevision!.Value,
                e.TipoMantenimiento,
                BuildCalendarState(e.ProximaRevision.Value)))
            .Concat(mantenimientosImpresora
                .Where(e => e.ProximaRevision is not null)
                .Select(e => new CalendarioMantenimientoResponse(
                    "Impresora",
                    e.Impresora?.CodigoInterno ?? "",
                    e.Impresora is null ? "Impresora" : $"{e.Impresora.Marca} {e.Impresora.Modelo}",
                    e.Impresora?.Dependencia?.Nombre ?? "Sin dependencia",
                    e.ProximaRevision!.Value,
                    e.TipoMantenimiento,
                    BuildCalendarState(e.ProximaRevision.Value))))
            .OrderBy(e => e.Fecha)
            .Take(20)
            .ToList();

        var semaforo = equipos
            .Select(e => BuildSemaforo("Equipo TIC", e.CodigoInterno, $"{e.Marca} {e.Modelo}", e.Dependencia, e.Estado))
            .Concat(impresoras.Select(e => BuildSemaforo("Impresora", e.CodigoInterno, $"{e.Marca} {e.Modelo}", e.Dependencia?.Nombre ?? "Sin dependencia", e.Estado)))
            .OrderBy(e => e.Color)
            .ThenBy(e => e.Codigo)
            .ToList();

        var encuestas = tickets
            .Where(e => e.CalificacionTiempo is not null &&
                e.CalificacionAtencion is not null &&
                e.CalificacionAmabilidad is not null &&
                e.CalificacionSolucion is not null)
            .ToList();

        var satisfaccion = new SatisfaccionTicketsResponse(
            encuestas.Count,
            Average(encuestas.Select(e => (e.CalificacionTiempo!.Value + e.CalificacionAtencion!.Value + e.CalificacionAmabilidad!.Value + e.CalificacionSolucion!.Value) / 4m)),
            Average(encuestas.Select(e => (decimal)e.CalificacionTiempo!.Value)),
            Average(encuestas.Select(e => (decimal)e.CalificacionAtencion!.Value)),
            Average(encuestas.Select(e => (decimal)e.CalificacionAmabilidad!.Value)),
            Average(encuestas.Select(e => (decimal)e.CalificacionSolucion!.Value)));

        return new AnaliticaResumenResponse(
            consumoPorDependencia,
            presupuesto,
            alertas,
            calendario,
            semaforo,
            satisfaccion);
    }

    public async Task<HistorialConsolidadoResponse?> GetHistorialAsync(
        string codigo,
        CancellationToken cancellationToken)
    {
        var normalized = codigo.Trim();

        var equipo = await _dbContext.Equipos
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.CodigoInterno == normalized, cancellationToken);

        if (equipo is not null)
        {
            var mantenimientos = await _dbContext.MantenimientosEquipo
                .AsNoTracking()
                .Where(e => e.EquipoId == equipo.Id)
                .ToListAsync(cancellationToken);

            var tickets = await _dbContext.TicketsMesaAyuda
                .AsNoTracking()
                .Where(e => e.EquipoCodigo == equipo.CodigoInterno)
                .ToListAsync(cancellationToken);

            var eventos = mantenimientos
                .Select(e => new HistorialConsolidadoItemResponse(
                    e.FechaMantenimiento,
                    "Mantenimiento",
                    e.TipoMantenimiento,
                    e.ActividadesRealizadas,
                    e.TecnicoResponsable))
                .Concat(tickets.Select(e => new HistorialConsolidadoItemResponse(
                    e.FechaSolicitud,
                    "Ticket",
                    e.Categoria,
                    e.Descripcion,
                    e.ResponsableAsignado ?? e.Solicitante)))
                .OrderByDescending(e => e.Fecha)
                .ToList();

            return new HistorialConsolidadoResponse(
                equipo.CodigoInterno,
                $"{equipo.Marca} {equipo.Modelo}",
                "Equipo TIC",
                eventos);
        }

        var impresora = await _dbContext.Impresoras
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.CodigoInterno == normalized, cancellationToken);

        if (impresora is null)
        {
            return null;
        }

        var mantenimientosImpresora = await _dbContext.MantenimientosImpresora
            .AsNoTracking()
            .Where(e => e.ImpresoraId == impresora.Id)
            .ToListAsync(cancellationToken);

        var movimientosConsumibles = await _dbContext.MovimientosConsumibles
            .AsNoTracking()
            .Include(e => e.Consumible)
            .Where(e => e.ImpresoraId == impresora.Id)
            .ToListAsync(cancellationToken);

        var ticketsImpresora = await _dbContext.TicketsMesaAyuda
            .AsNoTracking()
            .Where(e => e.ImpresoraCodigo == impresora.CodigoInterno)
            .ToListAsync(cancellationToken);

        var impresoraEventos = mantenimientosImpresora
            .Select(e => new HistorialConsolidadoItemResponse(
                e.FechaMantenimiento,
                "Mantenimiento",
                e.TipoMantenimiento,
                e.ActividadesRealizadas,
                e.TecnicoResponsable))
            .Concat(movimientosConsumibles.Select(e => new HistorialConsolidadoItemResponse(
                e.FechaMovimiento,
                "Consumible",
                e.TipoMovimiento,
                $"{e.Cantidad} x {e.Consumible?.Nombre ?? "Consumible"} ({e.CostoTotal:C0})",
                e.Responsable)))
            .Concat(ticketsImpresora.Select(e => new HistorialConsolidadoItemResponse(
                e.FechaSolicitud,
                "Ticket",
                e.Categoria,
                e.Descripcion,
                e.ResponsableAsignado ?? e.Solicitante)))
            .OrderByDescending(e => e.Fecha)
            .ToList();

        return new HistorialConsolidadoResponse(
            impresora.CodigoInterno,
            $"{impresora.Marca} {impresora.Modelo}",
            "Impresora",
            impresoraEventos);
    }

    private static bool Same(string? a, string b)
    {
        return string.Equals(a?.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);
    }

    private static decimal Average(IEnumerable<decimal> values)
    {
        var list = values.ToList();
        return list.Count == 0 ? 0 : Math.Round(list.Average(), 2);
    }

    private static string BuildCalendarState(DateOnly date)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (date < today) return "Vencido";
        if (date <= today.AddDays(15)) return "Proximo";
        return "Programado";
    }

    private static SemaforoActivoResponse BuildSemaforo(
        string tipoActivo,
        string codigo,
        string nombre,
        string dependencia,
        string estado)
    {
        var normalized = estado.ToLowerInvariant();

        if (normalized.Contains("baja"))
            return new SemaforoActivoResponse(tipoActivo, codigo, nombre, dependencia, estado, "Rojo", "Activo dado de baja o fuera de servicio.");

        if (normalized.Contains("mantenimiento"))
            return new SemaforoActivoResponse(tipoActivo, codigo, nombre, dependencia, estado, "Amarillo", "Activo requiere seguimiento tecnico.");

        return new SemaforoActivoResponse(tipoActivo, codigo, nombre, dependencia, estado, "Verde", "Activo operativo.");
    }
}
