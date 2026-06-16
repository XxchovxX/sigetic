namespace SIGETIC.Application.Consumibles;

public interface IConsumibleService
{
    Task<IReadOnlyList<ConsumibleResponse>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<ConsumibleResponse>> GetBajoStockAsync(
        CancellationToken cancellationToken);

    Task<ConsumibleResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<ConsumibleResponse> CreateAsync(
        CrearConsumibleRequest request,
        CancellationToken cancellationToken);

    Task<ConsumibleResponse> UpdateAsync(
        Guid id,
        ActualizarConsumibleRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<MovimientoConsumibleResponse>> GetMovimientosAsync(
        Guid consumibleId,
        CancellationToken cancellationToken);

    Task<MovimientoConsumibleResponse> CreateMovimientoAsync(
        Guid consumibleId,
        CrearMovimientoConsumibleRequest request,
        CancellationToken cancellationToken);
}
