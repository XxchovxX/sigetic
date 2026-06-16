namespace SIGETIC.Domain.Entities;

public sealed class HistorialConsumibleImpresora
{
    private HistorialConsumibleImpresora()
    {
    }

    public HistorialConsumibleImpresora(
        Guid impresoraId,
        DateOnly fechaMovimiento,
        string tipoMovimiento,
        string tipoConsumible,
        string referencia,
        string color,
        int cantidad,
        string responsableEntrega,
        int? contadorPaginas,
        string? observaciones)
    {
        Id = Guid.NewGuid();
        ImpresoraId = impresoraId;
        FechaMovimiento = fechaMovimiento;
        TipoMovimiento = tipoMovimiento.Trim();
        TipoConsumible = tipoConsumible.Trim();
        Referencia = referencia.Trim();
        Color = color.Trim();
        Cantidad = cantidad;
        ResponsableEntrega = responsableEntrega.Trim();
        ContadorPaginas = contadorPaginas;
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid ImpresoraId { get; private set; }

    public DateOnly FechaMovimiento { get; private set; }

    public string TipoMovimiento { get; private set; } = string.Empty;

    public string TipoConsumible { get; private set; } = string.Empty;

    public string Referencia { get; private set; } = string.Empty;

    public string Color { get; private set; } = string.Empty;

    public int Cantidad { get; private set; }

    public string ResponsableEntrega { get; private set; } = string.Empty;

    public int? ContadorPaginas { get; private set; }

    public string? Observaciones { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public Impresora? Impresora { get; private set; }
}