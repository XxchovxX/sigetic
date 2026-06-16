using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Tickets;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class TicketService : ITicketService
{
    private readonly SigeticDbContext _dbContext;
    private readonly IEmailNotificationService _emailNotificationService;

    public TicketService(
        SigeticDbContext dbContext,
        IEmailNotificationService emailNotificationService)
    {
        _dbContext = dbContext;
        _emailNotificationService = emailNotificationService;
    }

    public async Task<IReadOnlyList<TicketResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.TicketsMesaAyuda
            .AsNoTracking()
            .OrderByDescending(e => e.FechaSolicitud)
            .ThenByDescending(e => e.FechaCreacionUtc)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<TicketResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.TicketsMesaAyuda
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return ticket is null ? null : ToResponse(ticket);
    }

    public async Task<TicketResponse> CreateAsync(
        CrearTicketRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRequest(
            request.Solicitante,
            request.Dependencia,
            request.Categoria,
            request.Prioridad,
            request.Estado,
            request.Descripcion);

        var codigo = await GenerateCodeAsync(request.FechaSolicitud, cancellationToken);

        var ticket = new TicketMesaAyuda(
            codigo,
            request.FechaSolicitud,
            request.Solicitante,
            request.Dependencia,
            request.Categoria,
            request.Prioridad,
            request.Estado,
            request.Descripcion,
            request.ResponsableAsignado,
            request.EquipoCodigo,
            request.ImpresoraCodigo,
            request.FechaCompromiso,
            request.Solucion);

        _dbContext.TicketsMesaAyuda.Add(ticket);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(ticket);
        await _emailNotificationService.NotifyTicketCreatedAsync(
            response,
            cancellationToken);

        return response;
    }

    public async Task<TicketResponse> UpdateEstadoAsync(
        Guid id,
        ActualizarEstadoTicketRequest request,
        CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.TicketsMesaAyuda
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (ticket is null)
        {
            throw new KeyNotFoundException("No se encontró el ticket solicitado.");
        }

        ticket.ActualizarEstado(
            request.Estado,
            request.ResponsableAsignado,
            request.Solucion);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var response = ToResponse(ticket);
        await _emailNotificationService.NotifyTicketUpdatedAsync(
            response,
            cancellationToken);

        return response;
    }

    public async Task<TicketResponse> RegistrarEncuestaAsync(
        Guid id,
        RegistrarEncuestaTicketRequest request,
        CancellationToken cancellationToken)
    {
        var ticket = await _dbContext.TicketsMesaAyuda
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (ticket is null)
        {
            throw new KeyNotFoundException("No se encontró el ticket solicitado.");
        }

        ticket.RegistrarEncuesta(
            request.CalificacionTiempo,
            request.CalificacionAtencion,
            request.CalificacionAmabilidad,
            request.CalificacionSolucion,
            request.ComentarioSatisfaccion);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(ticket);
    }

    private async Task<string> GenerateCodeAsync(
        DateOnly fechaSolicitud,
        CancellationToken cancellationToken)
    {
        var prefix = $"MDA-{fechaSolicitud:yyyyMM}";
        var count = await _dbContext.TicketsMesaAyuda
            .CountAsync(e => e.Codigo.StartsWith(prefix), cancellationToken);

        return $"{prefix}-{count + 1:000}";
    }

    private static TicketResponse ToResponse(TicketMesaAyuda ticket)
    {
        return new TicketResponse(
            ticket.Id,
            ticket.Codigo,
            ticket.FechaSolicitud,
            ticket.Solicitante,
            ticket.Dependencia,
            ticket.Categoria,
            ticket.Prioridad,
            ticket.Estado,
            ticket.Descripcion,
            ticket.ResponsableAsignado,
            ticket.EquipoCodigo,
            ticket.ImpresoraCodigo,
            ticket.FechaCompromiso,
            ticket.Solucion,
            ticket.CalificacionTiempo,
            ticket.CalificacionAtencion,
            ticket.CalificacionAmabilidad,
            ticket.CalificacionSolucion,
            ticket.ComentarioSatisfaccion,
            ticket.FechaEncuestaUtc,
            ticket.FechaCreacionUtc,
            ticket.FechaActualizacionUtc);
    }

    private static void ValidateRequest(
        string solicitante,
        string dependencia,
        string categoria,
        string prioridad,
        string estado,
        string descripcion)
    {
        if (string.IsNullOrWhiteSpace(solicitante))
            throw new ArgumentException("El solicitante es obligatorio.");

        if (string.IsNullOrWhiteSpace(dependencia))
            throw new ArgumentException("La dependencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(categoria))
            throw new ArgumentException("La categoria es obligatoria.");

        if (string.IsNullOrWhiteSpace(prioridad))
            throw new ArgumentException("La prioridad es obligatoria.");

        if (string.IsNullOrWhiteSpace(estado))
            throw new ArgumentException("El estado es obligatorio.");

        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripcion de la solicitud es obligatoria.");
    }
}
