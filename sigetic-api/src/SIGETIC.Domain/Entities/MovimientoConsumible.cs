namespace SIGETIC.Domain.Entities;

public sealed class MovimientoConsumible
{
    private MovimientoConsumible()
    {
    }

    public MovimientoConsumible(
        Guid consumibleId,
        DateOnly fechaMovimiento,
        string tipoMovimiento,
        int cantidad,
        string responsable,
        string? destino,
        Guid? dependenciaId,
        Guid? impresoraId,
        string? documentoSoporte,
        string? observaciones,
        int stockResultante,
        decimal costoUnitario)
    {
        Id = Guid.NewGuid();
        ConsumibleId = consumibleId;
        FechaMovimiento = fechaMovimiento;
        TipoMovimiento = tipoMovimiento.Trim();
        Cantidad = cantidad;
        Responsable = responsable.Trim();
        Destino = Normalize(destino);
        DependenciaId = dependenciaId;
        ImpresoraId = impresoraId;
        DocumentoSoporte = Normalize(documentoSoporte);
        Observaciones = Normalize(observaciones);
        StockResultante = stockResultante;
        CostoUnitario = costoUnitario;
        CostoTotal = cantidad * costoUnitario;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid ConsumibleId { get; private set; }

    public DateOnly FechaMovimiento { get; private set; }

    public string TipoMovimiento { get; private set; } = string.Empty;

    public int Cantidad { get; private set; }

    public string Responsable { get; private set; } = string.Empty;

    public string? Destino { get; private set; }

    public Guid? DependenciaId { get; private set; }

    public Guid? ImpresoraId { get; private set; }

    public string? DocumentoSoporte { get; private set; }

    public string? Observaciones { get; private set; }

    public int StockResultante { get; private set; }

    public decimal CostoUnitario { get; private set; }

    public decimal CostoTotal { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public Consumible? Consumible { get; private set; }

    public Dependencia? Dependencia { get; private set; }

    public Impresora? Impresora { get; private set; }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
