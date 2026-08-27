namespace SIGETIC.Application.Equipos;

public interface IInventarioDeteccionService
{
    Task<CrearInventarioDeteccionResponse> CreateAsync(
        Guid usuarioId,
        CancellationToken cancellationToken);

    Task ReceiveAsync(
        string token,
        ReportarInventarioDeteccionRequest request,
        string? direccionIpOrigen,
        CancellationToken cancellationToken);

    Task<EstadoInventarioDeteccionResponse?> GetStatusAsync(
        Guid id,
        Guid usuarioId,
        CancellationToken cancellationToken);
}
