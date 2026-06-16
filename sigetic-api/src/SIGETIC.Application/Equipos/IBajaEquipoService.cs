namespace SIGETIC.Application.Equipos;

public interface IBajaEquipoService
{
    Task<BajaEquipoResponse?> GetByEquipoIdAsync(
        Guid equipoId,
        CancellationToken cancellationToken);

    Task<BajaEquipoResponse> CreateAsync(
        Guid equipoId,
        CrearBajaEquipoRequest request,
        CancellationToken cancellationToken);
}