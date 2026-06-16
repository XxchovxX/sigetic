using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Equipos;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class MantenimientoEquipoService : IMantenimientoEquipoService
{
    private readonly SigeticDbContext _dbContext;

    public MantenimientoEquipoService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<MantenimientoEquipoResponse>> GetByEquipoIdAsync(
        Guid equipoId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.MantenimientosEquipo
            .AsNoTracking()
            .Where(e => e.EquipoId == equipoId)
            .OrderByDescending(e => e.FechaMantenimiento)
            .ThenByDescending(e => e.FechaCreacionUtc)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<MantenimientoEquipoResponse> CreateAsync(
        Guid equipoId,
        CrearMantenimientoEquipoRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRequest(request);

        var equipo = await _dbContext.Equipos
            .FirstOrDefaultAsync(e => e.Id == equipoId, cancellationToken);

        if (equipo is null)
        {
            throw new InvalidOperationException("No se encontró el equipo solicitado.");
        }

        var mantenimiento = new MantenimientoEquipo(
            equipoId,
            request.TipoMantenimiento,
            request.FechaMantenimiento,
            request.TecnicoResponsable,
            request.Diagnostico,
            request.ActividadesRealizadas,
            request.RepuestosUtilizados,
            request.EstadoResultante,
            request.ProximaRevision,
            request.Observaciones,
            request.FirmaTecnico,
            request.FirmaRecibe,
            request.NombreRecibe,
            request.DocumentoRecibe
        );

        equipo.ActualizarEstado(request.EstadoResultante);

        _dbContext.MantenimientosEquipo.Add(mantenimiento);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(mantenimiento);
    }

    private static MantenimientoEquipoResponse ToResponse(
        MantenimientoEquipo mantenimiento)
    {
        return new MantenimientoEquipoResponse(
            mantenimiento.Id,
            mantenimiento.EquipoId,
            mantenimiento.TipoMantenimiento,
            mantenimiento.FechaMantenimiento,
            mantenimiento.TecnicoResponsable,
            mantenimiento.Diagnostico,
            mantenimiento.ActividadesRealizadas,
            mantenimiento.RepuestosUtilizados,
            mantenimiento.EstadoResultante,
            mantenimiento.ProximaRevision,
            mantenimiento.Observaciones,
            mantenimiento.FirmaTecnico,
            mantenimiento.FirmaRecibe,
            mantenimiento.NombreRecibe,
            mantenimiento.DocumentoRecibe,
            mantenimiento.FechaFirmaUtc,
            mantenimiento.FechaCreacionUtc
        );
    }

    private static void ValidateRequest(CrearMantenimientoEquipoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TipoMantenimiento))
            throw new ArgumentException("El tipo de mantenimiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.TecnicoResponsable))
            throw new ArgumentException("El técnico responsable es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Diagnostico))
            throw new ArgumentException("El diagnóstico es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.ActividadesRealizadas))
            throw new ArgumentException("Las actividades realizadas son obligatorias.");

        if (string.IsNullOrWhiteSpace(request.EstadoResultante))
            throw new ArgumentException("El estado resultante es obligatorio.");
    }
}
