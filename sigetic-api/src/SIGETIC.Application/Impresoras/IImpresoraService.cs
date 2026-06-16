namespace SIGETIC.Application.Impresoras;

public interface IImpresoraService
{
    Task<IReadOnlyList<ImpresoraResponse>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<ImpresoraResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<ImpresoraResponse> CreateAsync(
        CrearImpresoraRequest request,
        CancellationToken cancellationToken);

    Task<ImpresoraResponse> UpdateAsync(
        Guid id,
        ActualizarImpresoraRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MantenimientoImpresoraResponse>> GetMantenimientosAsync(
        Guid impresoraId,
        CancellationToken cancellationToken);

    Task<MantenimientoImpresoraResponse> CreateMantenimientoAsync(
        Guid impresoraId,
        CrearMantenimientoImpresoraRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<HistorialConsumibleImpresoraResponse>> GetHistorialConsumiblesAsync(
        Guid impresoraId,
        CancellationToken cancellationToken);

    Task<HistorialConsumibleImpresoraResponse> CreateHistorialConsumibleAsync(
        Guid impresoraId,
        CrearHistorialConsumibleImpresoraRequest request,
        CancellationToken cancellationToken);
}