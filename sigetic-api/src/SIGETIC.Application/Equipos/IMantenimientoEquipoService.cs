namespace SIGETIC.Application.Equipos;

public interface IMantenimientoEquipoService
{
    Task<IReadOnlyList<MantenimientoEquipoResponse>> GetByEquipoIdAsync(
        Guid equipoId,
        CancellationToken cancellationToken);

    Task<MantenimientoEquipoResponse> CreateAsync(
        Guid equipoId,
        CrearMantenimientoEquipoRequest request,
        CancellationToken cancellationToken);
}