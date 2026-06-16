using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SIGETIC.Application.Tickets;

namespace SIGETIC.Infrastructure.Services;

public sealed class EmailNotificationService : IEmailNotificationService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(
        IConfiguration configuration,
        ILogger<EmailNotificationService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task NotifyTicketCreatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken)
    {
        var subject = $"SIGETIC - Nuevo ticket {ticket.Codigo}";
        var body = BuildTicketBody(
            "Se creó una nueva solicitud en mesa de ayuda.",
            ticket);

        return SendTicketEmailAsync(subject, body, cancellationToken);
    }

    public Task NotifyTicketUpdatedAsync(
        TicketResponse ticket,
        CancellationToken cancellationToken)
    {
        var subject = $"SIGETIC - Ticket {ticket.Codigo} actualizado";
        var body = BuildTicketBody(
            "Se actualizó el estado de una solicitud en mesa de ayuda.",
            ticket);

        return SendTicketEmailAsync(subject, body, cancellationToken);
    }

    private async Task SendTicketEmailAsync(
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var settings = ReadSettings();

        if (!settings.Enabled)
        {
            return;
        }

        if (!settings.IsComplete)
        {
            _logger.LogWarning(
                "Email notifications are enabled but SMTP settings are incomplete.");
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(settings.FromAddress!, settings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false,
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };

        foreach (var recipient in settings.Recipients)
        {
            message.To.Add(recipient);
        }

        using var smtp = new SmtpClient(settings.SmtpHost!, settings.SmtpPort)
        {
            EnableSsl = settings.EnableSsl,
            Credentials = new NetworkCredential(
                settings.SmtpUser,
                settings.SmtpPassword)
        };

        try
        {
            await smtp.SendMailAsync(message, cancellationToken);
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "SIGETIC could not send ticket email notification.");
        }
    }

    private EmailSettings ReadSettings()
    {
        var recipients = (_configuration["Email:TicketRecipients"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(value => value.Contains('@'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return new EmailSettings(
            Enabled: _configuration.GetValue("Email:Enabled", false),
            SmtpHost: _configuration["Email:SmtpHost"],
            SmtpPort: _configuration.GetValue("Email:SmtpPort", 587),
            SmtpUser: _configuration["Email:SmtpUser"],
            SmtpPassword: _configuration["Email:SmtpPassword"],
            FromAddress: _configuration["Email:FromAddress"],
            FromName: _configuration["Email:FromName"] ?? "SIGETIC",
            EnableSsl: _configuration.GetValue("Email:EnableSsl", true),
            Recipients: recipients);
    }

    private static string BuildTicketBody(
        string title,
        TicketResponse ticket)
    {
        var builder = new StringBuilder();
        builder.AppendLine(title);
        builder.AppendLine();
        builder.AppendLine($"Código: {ticket.Codigo}");
        builder.AppendLine($"Fecha: {ticket.FechaSolicitud:yyyy-MM-dd}");
        builder.AppendLine($"Solicitante: {ticket.Solicitante}");
        builder.AppendLine($"Dependencia: {ticket.Dependencia}");
        builder.AppendLine($"Categoría: {ticket.Categoria}");
        builder.AppendLine($"Prioridad: {ticket.Prioridad}");
        builder.AppendLine($"Estado: {ticket.Estado}");

        if (!string.IsNullOrWhiteSpace(ticket.ResponsableAsignado))
        {
            builder.AppendLine($"Responsable: {ticket.ResponsableAsignado}");
        }

        if (!string.IsNullOrWhiteSpace(ticket.EquipoCodigo))
        {
            builder.AppendLine($"Equipo: {ticket.EquipoCodigo}");
        }

        if (!string.IsNullOrWhiteSpace(ticket.ImpresoraCodigo))
        {
            builder.AppendLine($"Impresora: {ticket.ImpresoraCodigo}");
        }

        builder.AppendLine();
        builder.AppendLine("Descripción:");
        builder.AppendLine(ticket.Descripcion);

        if (!string.IsNullOrWhiteSpace(ticket.Solucion))
        {
            builder.AppendLine();
            builder.AppendLine("Solución:");
            builder.AppendLine(ticket.Solucion);
        }

        builder.AppendLine();
        builder.AppendLine("Este mensaje fue generado automáticamente por SIGETIC.");

        return builder.ToString();
    }

    private sealed record EmailSettings(
        bool Enabled,
        string? SmtpHost,
        int SmtpPort,
        string? SmtpUser,
        string? SmtpPassword,
        string? FromAddress,
        string FromName,
        bool EnableSsl,
        IReadOnlyList<string> Recipients)
    {
        public bool IsComplete =>
            !string.IsNullOrWhiteSpace(SmtpHost) &&
            !string.IsNullOrWhiteSpace(SmtpUser) &&
            !string.IsNullOrWhiteSpace(SmtpPassword) &&
            !string.IsNullOrWhiteSpace(FromAddress) &&
            Recipients.Count > 0;
    }
}
