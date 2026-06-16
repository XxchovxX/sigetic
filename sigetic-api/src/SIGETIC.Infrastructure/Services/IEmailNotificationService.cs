using SIGETIC.Application.Tickets;

namespace SIGETIC.Infrastructure.Services;

public interface IEmailNotificationService
{
    Task NotifyTicketCreatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken);

    Task NotifyTicketUpdatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken);
}
