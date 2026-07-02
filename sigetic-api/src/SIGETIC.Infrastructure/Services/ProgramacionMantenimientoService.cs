using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.ProgramacionMantenimientos;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class ProgramacionMantenimientoService : IProgramacionMantenimientoService
{
    private readonly SigeticDbContext _dbContext;
    private readonly IEmailNotificationService _emailNotificationService;

    public ProgramacionMantenimientoService(
        SigeticDbContext dbContext,
        IEmailNotificationService emailNotificationService)
    {
        _dbContext = dbContext;
        _emailNotificationService = emailNotificationService;
    }

    public async Task<IReadOnlyList<ProgramacionMantenimientoResponse>> GetAllAsync(
        string? desde,
        string? hasta,
        string? estado,
        string? tipoActivo,
        CancellationToken cancellationToken)
    {
        await UpdateOverdueAsync(cancellationToken);

        DateOnly? from = ParseOptionalDate(desde, "La fecha inicial no tiene un formato valido.");
        DateOnly? to = ParseOptionalDate(hasta, "La fecha final no tiene un formato valido.");

        var query = _dbContext.ProgramacionesMantenimiento
            .AsNoTracking()
            .AsQueryable();

        if (from is not null)
        {
            query = query.Where(e => e.FechaProgramada >= from.Value);
        }

        if (to is not null)
        {
            query = query.Where(e => e.FechaProgramada <= to.Value);
        }

        if (!string.IsNullOrWhiteSpace(estado) && !estado.Equals("Todos", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.Estado == estado.Trim());
        }

        if (!string.IsNullOrWhiteSpace(tipoActivo) && !tipoActivo.Equals("Todos", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(e => e.TipoActivo == tipoActivo.Trim());
        }

        return await query
            .OrderBy(e => e.FechaProgramada)
            .ThenBy(e => e.HoraProgramada)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProgramacionMantenimientoResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var programacion = await _dbContext.ProgramacionesMantenimiento
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return programacion is null ? null : ToResponse(programacion);
    }

    public async Task<ProgramacionMantenimientoResponse> CreateAsync(
        CrearProgramacionMantenimientoRequest request,
        CancellationToken cancellationToken)
    {
        ValidateCreateRequest(request);

        var fechaProgramada = ParseRequiredDate(
            request.FechaProgramada,
            "La fecha programada no tiene un formato valido.");
        var horaProgramada = ParseOptionalTime(
            request.HoraProgramada,
            "La hora programada no tiene un formato valido.");

        var asset = await ResolveAssetAsync(
            request.TipoActivo,
            request.EquipoId,
            request.ImpresoraId,
            cancellationToken);

        var programacion = new ProgramacionMantenimiento(
            request.TipoActivo,
            request.EquipoId,
            request.ImpresoraId,
            asset.Codigo,
            asset.Nombre,
            request.TipoMantenimiento,
            fechaProgramada,
            horaProgramada,
            request.Frecuencia,
            request.TecnicoResponsable,
            request.CorreoTecnico,
            request.Observaciones);

        _dbContext.ProgramacionesMantenimiento.Add(programacion);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(programacion);
        await _emailNotificationService.NotifyMaintenanceScheduledAsync(
            response,
            cancellationToken);

        return response;
    }

    public async Task<ProgramacionMantenimientoResponse> UpdateAsync(
        Guid id,
        ActualizarProgramacionMantenimientoRequest request,
        CancellationToken cancellationToken)
    {
        var programacion = await _dbContext.ProgramacionesMantenimiento
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (programacion is null)
        {
            throw new KeyNotFoundException("No se encontro la programacion solicitada.");
        }

        var fechaProgramada = ParseRequiredDate(
            request.FechaProgramada,
            "La fecha programada no tiene un formato valido.");
        var horaProgramada = ParseOptionalTime(
            request.HoraProgramada,
            "La hora programada no tiene un formato valido.");

        programacion.Actualizar(
            fechaProgramada,
            horaProgramada,
            request.Frecuencia,
            request.TecnicoResponsable,
            request.CorreoTecnico,
            request.Observaciones);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(programacion);
    }

    public async Task<ProgramacionMantenimientoResponse> MarcarEjecutadoAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var programacion = await _dbContext.ProgramacionesMantenimiento
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (programacion is null)
        {
            throw new KeyNotFoundException("No se encontro la programacion solicitada.");
        }

        programacion.MarcarEjecutado();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(programacion);
    }

    public async Task CancelarAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var programacion = await _dbContext.ProgramacionesMantenimiento
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (programacion is null)
        {
            throw new KeyNotFoundException("No se encontro la programacion solicitada.");
        }

        programacion.Cancelar();
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<RecordatoriosMantenimientoResponse> EnviarRecordatoriosAsync(
        EnviarRecordatoriosMantenimientoRequest request,
        CancellationToken cancellationToken)
    {
        var diasAnticipacion = request.DiasAnticipacion <= 0 ? 3 : Math.Min(request.DiasAnticipacion, 30);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var limit = today.AddDays(diasAnticipacion);

        await UpdateOverdueAsync(cancellationToken);

        var programaciones = await _dbContext.ProgramacionesMantenimiento
            .Where(e =>
                e.Estado != "Ejecutado" &&
                e.Estado != "Cancelado" &&
                e.FechaProgramada <= limit &&
                (e.UltimaNotificacionUtc == null || e.UltimaNotificacionUtc.Value.Date < DateTime.UtcNow.Date))
            .OrderBy(e => e.FechaProgramada)
            .ThenBy(e => e.HoraProgramada)
            .ToListAsync(cancellationToken);

        foreach (var programacion in programaciones)
        {
            var response = ToResponse(programacion);
            await _emailNotificationService.NotifyMaintenanceReminderAsync(
                response,
                cancellationToken);
            programacion.MarcarNotificado();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RecordatoriosMantenimientoResponse(
            programaciones.Count,
            programaciones.Select(ToResponse).ToList());
    }

    private async Task UpdateOverdueAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var overdue = await _dbContext.ProgramacionesMantenimiento
            .Where(e =>
                (e.Estado == "Programado" || e.Estado == "Notificado") &&
                e.FechaProgramada < today)
            .ToListAsync(cancellationToken);

        if (overdue.Count == 0)
        {
            return;
        }

        foreach (var programacion in overdue)
        {
            programacion.MarcarVencido();
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task<AssetInfo> ResolveAssetAsync(
        string tipoActivo,
        Guid? equipoId,
        Guid? impresoraId,
        CancellationToken cancellationToken)
    {
        if (tipoActivo == "Equipo")
        {
            var equipo = await _dbContext.Equipos
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == equipoId, cancellationToken);

            if (equipo is null)
            {
                throw new InvalidOperationException("No se encontro el equipo seleccionado.");
            }

            return new AssetInfo(
                equipo.CodigoInterno,
                $"{equipo.TipoEquipo} {equipo.Marca} {equipo.Modelo}".Trim());
        }

        if (tipoActivo == "Impresora")
        {
            var impresora = await _dbContext.Impresoras
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == impresoraId, cancellationToken);

            if (impresora is null)
            {
                throw new InvalidOperationException("No se encontro la impresora seleccionada.");
            }

            return new AssetInfo(
                impresora.CodigoInterno,
                $"{impresora.Marca} {impresora.Modelo}".Trim());
        }

        throw new ArgumentException("El tipo de activo debe ser Equipo o Impresora.");
    }

    private static void ValidateCreateRequest(CrearProgramacionMantenimientoRequest request)
    {
        if (request.TipoActivo is not ("Equipo" or "Impresora"))
            throw new ArgumentException("El tipo de activo debe ser Equipo o Impresora.");

        if (request.TipoActivo == "Equipo" && request.EquipoId is null)
            throw new ArgumentException("Debe seleccionar un equipo.");

        if (request.TipoActivo == "Impresora" && request.ImpresoraId is null)
            throw new ArgumentException("Debe seleccionar una impresora.");

        if (string.IsNullOrWhiteSpace(request.TipoMantenimiento))
            throw new ArgumentException("El tipo de mantenimiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Frecuencia))
            throw new ArgumentException("La frecuencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(request.TecnicoResponsable))
            throw new ArgumentException("El tecnico responsable es obligatorio.");
    }

    private static ProgramacionMantenimientoResponse ToResponse(
        ProgramacionMantenimiento programacion)
    {
        return new ProgramacionMantenimientoResponse(
            programacion.Id,
            programacion.TipoActivo,
            programacion.EquipoId,
            programacion.ImpresoraId,
            programacion.CodigoActivo,
            programacion.NombreActivo,
            programacion.TipoMantenimiento,
            programacion.FechaProgramada,
            programacion.HoraProgramada,
            programacion.Frecuencia,
            programacion.Estado,
            programacion.TecnicoResponsable,
            programacion.CorreoTecnico,
            programacion.Observaciones,
            programacion.UltimaNotificacionUtc,
            programacion.FechaCreacionUtc,
            programacion.FechaActualizacionUtc);
    }

    private static DateOnly ParseRequiredDate(string value, string errorMessage)
    {
        if (!DateOnly.TryParse(value, out DateOnly date))
        {
            throw new ArgumentException(errorMessage);
        }

        return date;
    }

    private static DateOnly? ParseOptionalDate(string? value, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!DateOnly.TryParse(value, out DateOnly date))
        {
            throw new ArgumentException(errorMessage);
        }

        return date;
    }

    private static TimeOnly? ParseOptionalTime(string? value, string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!TimeOnly.TryParse(value, out TimeOnly time))
        {
            throw new ArgumentException(errorMessage);
        }

        return time;
    }

    private sealed record AssetInfo(string Codigo, string Nombre);
}
