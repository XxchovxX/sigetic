namespace SIGETIC.Domain.Entities;

public sealed class TicketMesaAyuda
{
    private TicketMesaAyuda()
    {
    }

    public TicketMesaAyuda(
        string codigo,
        DateOnly fechaSolicitud,
        string solicitante,
        string dependencia,
        string categoria,
        string prioridad,
        string estado,
        string descripcion,
        string? responsableAsignado,
        string? equipoCodigo,
        string? impresoraCodigo,
        DateOnly? fechaCompromiso,
        string? solucion)
    {
        Id = Guid.NewGuid();
        Codigo = codigo.Trim();
        FechaSolicitud = fechaSolicitud;
        Solicitante = solicitante.Trim();
        Dependencia = dependencia.Trim();
        Categoria = categoria.Trim();
        Prioridad = prioridad.Trim();
        Estado = estado.Trim();
        Descripcion = descripcion.Trim();
        ResponsableAsignado = string.IsNullOrWhiteSpace(responsableAsignado) ? null : responsableAsignado.Trim();
        EquipoCodigo = string.IsNullOrWhiteSpace(equipoCodigo) ? null : equipoCodigo.Trim();
        ImpresoraCodigo = string.IsNullOrWhiteSpace(impresoraCodigo) ? null : impresoraCodigo.Trim();
        FechaCompromiso = fechaCompromiso;
        Solucion = string.IsNullOrWhiteSpace(solucion) ? null : solucion.Trim();
        Eliminado = false;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Codigo { get; private set; } = string.Empty;
    public DateOnly FechaSolicitud { get; private set; }
    public string Solicitante { get; private set; } = string.Empty;
    public string Dependencia { get; private set; } = string.Empty;
    public string Categoria { get; private set; } = string.Empty;
    public string Prioridad { get; private set; } = string.Empty;
    public string Estado { get; private set; } = string.Empty;
    public string Descripcion { get; private set; } = string.Empty;
    public string? ResponsableAsignado { get; private set; }
    public string? EquipoCodigo { get; private set; }
    public string? ImpresoraCodigo { get; private set; }
    public DateOnly? FechaCompromiso { get; private set; }
    public string? Solucion { get; private set; }
    public int? CalificacionTiempo { get; private set; }
    public int? CalificacionAtencion { get; private set; }
    public int? CalificacionAmabilidad { get; private set; }
    public int? CalificacionSolucion { get; private set; }
    public string? ComentarioSatisfaccion { get; private set; }
    public DateTime? FechaEncuestaUtc { get; private set; }
    public bool Eliminado { get; private set; }
    public DateTime? FechaEliminacionUtc { get; private set; }
    public string? EliminadoPor { get; private set; }
    public DateTime FechaCreacionUtc { get; private set; }
    public DateTime? FechaActualizacionUtc { get; private set; }
    public IReadOnlyCollection<TicketMesaAyudaHistorial> Historial => _historial;

    private readonly List<TicketMesaAyudaHistorial> _historial = new();

    public void ActualizarEstado(string estado, string? responsableAsignado, string? solucion)
    {
        if (string.IsNullOrWhiteSpace(estado))
        {
            throw new ArgumentException("El estado del ticket es obligatorio.");
        }

        Estado = estado.Trim();
        ResponsableAsignado = string.IsNullOrWhiteSpace(responsableAsignado) ? ResponsableAsignado : responsableAsignado.Trim();
        Solucion = string.IsNullOrWhiteSpace(solucion) ? Solucion : solucion.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void MarcarEliminado(string usuario)
    {
        if (Eliminado)
        {
            return;
        }

        Eliminado = true;
        EliminadoPor = string.IsNullOrWhiteSpace(usuario) ? "Sistema" : usuario.Trim();
        FechaEliminacionUtc = DateTime.UtcNow;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void RegistrarEncuesta(
        int calificacionTiempo,
        int calificacionAtencion,
        int calificacionAmabilidad,
        int calificacionSolucion,
        string? comentario)
    {
        ValidateRating(calificacionTiempo, nameof(calificacionTiempo));
        ValidateRating(calificacionAtencion, nameof(calificacionAtencion));
        ValidateRating(calificacionAmabilidad, nameof(calificacionAmabilidad));
        ValidateRating(calificacionSolucion, nameof(calificacionSolucion));

        CalificacionTiempo = calificacionTiempo;
        CalificacionAtencion = calificacionAtencion;
        CalificacionAmabilidad = calificacionAmabilidad;
        CalificacionSolucion = calificacionSolucion;
        ComentarioSatisfaccion = string.IsNullOrWhiteSpace(comentario)
            ? null
            : comentario.Trim();
        FechaEncuestaUtc = DateTime.UtcNow;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    private static void ValidateRating(int value, string field)
    {
        if (value is < 1 or > 5)
        {
            throw new ArgumentException($"{field} debe estar entre 1 y 5.");
        }
    }
}
