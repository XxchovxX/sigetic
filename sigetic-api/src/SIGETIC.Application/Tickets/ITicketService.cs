namespace SIGETIC.Application.Tickets;

public interface ITicketService
{
    Task<IReadOnlyList<TicketResponse>> GetAllAsync(CancellationToken cancellationToken);

    Task<TicketResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<TicketResponse> CreateAsync(CrearTicketRequest request, CancellationToken cancellationToken);

    Task<TicketResponse> UpdateEstadoAsync(
        Guid id,
        ActualizarEstadoTicketRequest request,
        CancellationToken cancellationToken);

    Task<TicketResponse> RegistrarEncuestaAsync(
        Guid id,
        RegistrarEncuestaTicketRequest request,
        CancellationToken cancellationToken);
}
