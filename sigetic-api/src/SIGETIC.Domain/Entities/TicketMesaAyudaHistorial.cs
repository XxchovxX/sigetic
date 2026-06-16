namespace SIGETIC.Domain.Entities;

public sealed class TicketMesaAyudaHistorial
{
    private TicketMesaAyudaHistorial()
    {
    }

    public TicketMesaAyudaHistorial(
        Guid ticketId,
        string tipoEvento,
        string usuario,
        string? estadoAnterior,
        string? estadoNuevo,
        string? detalle)
    {
        Id = Guid.NewGuid();
        TicketId = ticketId;
        TipoEvento = tipoEvento.Trim();
        Usuario = string.IsNullOrWhiteSpace(usuario) ? "Sistema" : usuario.Trim();
        EstadoAnterior = string.IsNullOrWhiteSpace(estadoAnterior) ? null : estadoAnterior.Trim();
        EstadoNuevo = string.IsNullOrWhiteSpace(estadoNuevo) ? null : estadoNuevo.Trim();
        Detalle = string.IsNullOrWhiteSpace(detalle) ? null : detalle.Trim();
        FechaEventoUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid TicketId { get; private set; }
    public string TipoEvento { get; private set; } = string.Empty;
    public string Usuario { get; private set; } = string.Empty;
    public string? EstadoAnterior { get; private set; }
    public string? EstadoNuevo { get; private set; }
    public string? Detalle { get; private set; }
    public DateTime FechaEventoUtc { get; private set; }

    public TicketMesaAyuda? Ticket { get; private set; }
}
