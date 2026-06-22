using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Auditoria;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class AuditoriaService : IAuditoriaService
{
    private readonly SigeticDbContext _dbContext;

    public AuditoriaService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<AuditoriaRegistroResponse>> GetAsync(
        string? modulo,
        string? accion,
        string? usuario,
        DateTime? desdeUtc,
        DateTime? hastaUtc,
        int take,
        CancellationToken cancellationToken)
    {
        take = Math.Clamp(take, 25, 500);

        IQueryable<AuditoriaRegistro> query = _dbContext.AuditoriaRegistros
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(modulo))
        {
            query = query.Where(e => e.Modulo == modulo.Trim());
        }

        if (!string.IsNullOrWhiteSpace(accion))
        {
            query = query.Where(e => e.Accion == accion.Trim());
        }

        if (!string.IsNullOrWhiteSpace(usuario))
        {
            var userFilter = usuario.Trim().ToLower();
            query = query.Where(e => e.Usuario.ToLower().Contains(userFilter));
        }

        if (desdeUtc is not null)
        {
            query = query.Where(e => e.FechaEventoUtc >= desdeUtc.Value);
        }

        if (hastaUtc is not null)
        {
            query = query.Where(e => e.FechaEventoUtc <= hastaUtc.Value);
        }

        return await query
            .OrderByDescending(e => e.FechaEventoUtc)
            .Take(take)
            .Select(e => new AuditoriaRegistroResponse(
                e.Id,
                e.Modulo,
                e.Accion,
                e.Entidad,
                e.RegistroId,
                e.Usuario,
                e.Rol,
                e.MetodoHttp,
                e.Ruta,
                e.DireccionIp,
                e.Resumen,
                e.FechaEventoUtc))
            .ToListAsync(cancellationToken);
    }
}
