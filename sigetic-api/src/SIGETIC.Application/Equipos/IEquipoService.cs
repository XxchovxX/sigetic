namespace SIGETIC.Application.Equipos;

public interface IEquipoService
{
    Task<IReadOnlyList<EquipoResponse>> GetAllAsync(CancellationToken cancellationToken);

    Task<EquipoResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<EquipoResponse> CreateAsync(
        CrearEquipoRequest request,
        CancellationToken cancellationToken);

    Task<EquipoResponse> UpdateAsync(
        Guid id,
        ActualizarEquipoRequest request,
        CancellationToken cancellationToken);
}