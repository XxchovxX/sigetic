using SIGETIC.Application.Tickets;
using SIGETIC.Application.ProgramacionMantenimientos;

namespace SIGETIC.Infrastructure.Services;

public interface IEmailNotificationService
{
    Task NotifyTicketCreatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken);

    Task NotifyTicketUpdatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken);

    Task NotifyMaintenanceScheduledAsync(
        ProgramacionMantenimientoResponse programacion,
        CancellationToken cancellationToken);

    Task NotifyMaintenanceReminderAsync(
        ProgramacionMantenimientoResponse programacion,
        CancellationToken cancellationToken);
}
