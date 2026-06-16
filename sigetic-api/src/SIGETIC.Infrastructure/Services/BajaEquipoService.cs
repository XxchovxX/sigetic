using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Equipos;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class BajaEquipoService : IBajaEquipoService
{
    private readonly SigeticDbContext _dbContext;

    public BajaEquipoService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<BajaEquipoResponse?> GetByEquipoIdAsync(
        Guid equipoId,
        CancellationToken cancellationToken)
    {
        var baja = await _dbContext.BajasEquipo
            .AsNoTracking()
            .Where(e => e.EquipoId == equipoId)
            .OrderByDescending(e => e.FechaCreacionUtc)
            .FirstOrDefaultAsync(cancellationToken);

        return baja is null ? null : ToResponse(baja);
    }

    public async Task<BajaEquipoResponse> CreateAsync(
        Guid equipoId,
        CrearBajaEquipoRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRequest(request);

        var equipo = await _dbContext.Equipos
            .FirstOrDefaultAsync(e => e.Id == equipoId, cancellationToken);

        if (equipo is null)
        {
            throw new InvalidOperationException("No se encontró el equipo solicitado.");
        }

        bool alreadyHasBaja = await _dbContext.BajasEquipo
            .AnyAsync(e => e.EquipoId == equipoId, cancellationToken);

        if (alreadyHasBaja)
        {
            throw new InvalidOperationException(
                "El equipo ya tiene una baja registrada. No es posible registrar una segunda baja.");
        }

        var baja = new BajaEquipo(
            equipoId,
            request.FechaBaja,
            request.MotivoBaja,
            request.ResponsableBaja,
            request.EstadoFisico,
            request.DisposicionFinal,
            request.Observaciones
        );

        equipo.ActualizarEstado("Dado de baja");

        _dbContext.BajasEquipo.Add(baja);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(baja);
    }

    private static BajaEquipoResponse ToResponse(BajaEquipo baja)
    {
        return new BajaEquipoResponse(
            baja.Id,
            baja.EquipoId,
            baja.FechaBaja,
            baja.MotivoBaja,
            baja.ResponsableBaja,
            baja.EstadoFisico,
            baja.DisposicionFinal,
            baja.Observaciones,
            baja.FechaCreacionUtc
        );
    }

    private static void ValidateRequest(CrearBajaEquipoRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.MotivoBaja))
            throw new ArgumentException("El motivo de baja es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.ResponsableBaja))
            throw new ArgumentException("El responsable de la baja es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.EstadoFisico))
            throw new ArgumentException("El estado físico del equipo es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.DisposicionFinal))
            throw new ArgumentException("La disposición final es obligatoria.");
    }
}