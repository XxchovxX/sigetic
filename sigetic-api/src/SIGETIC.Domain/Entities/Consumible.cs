namespace SIGETIC.Domain.Entities;

public sealed class Consumible
{
    private Consumible()
    {
    }

    public Consumible(
        string codigoInterno,
        string nombre,
        string tipoConsumible,
        string referencia,
        string color,
        string unidadMedida,
        int stockActual,
        int stockMinimo,
        decimal costoUnitario,
        string? marcaCompatible,
        string? modelosCompatibles,
        string? observaciones)
    {
        Id = Guid.NewGuid();
        CodigoInterno = codigoInterno.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        TipoConsumible = tipoConsumible.Trim();
        Referencia = referencia.Trim();
        Color = color.Trim();
        UnidadMedida = unidadMedida.Trim();
        StockActual = stockActual;
        StockMinimo = stockMinimo;
        CostoUnitario = costoUnitario;
        MarcaCompatible = Normalize(marcaCompatible);
        ModelosCompatibles = Normalize(modelosCompatibles);
        Observaciones = Normalize(observaciones);
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string CodigoInterno { get; private set; } = string.Empty;

    public string Nombre { get; private set; } = string.Empty;

    public string TipoConsumible { get; private set; } = string.Empty;

    public string Referencia { get; private set; } = string.Empty;

    public string Color { get; private set; } = string.Empty;

    public string UnidadMedida { get; private set; } = string.Empty;

    public int StockActual { get; private set; }

    public int StockMinimo { get; private set; }

    public decimal CostoUnitario { get; private set; }

    public string? MarcaCompatible { get; private set; }

    public string? ModelosCompatibles { get; private set; }

    public string? Observaciones { get; private set; }

    public bool Activo { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public bool BajoStock => StockActual <= StockMinimo;

    public void ActualizarDatos(
        string codigoInterno,
        string nombre,
        string tipoConsumible,
        string referencia,
        string color,
        string unidadMedida,
        int stockMinimo,
        decimal costoUnitario,
        string? marcaCompatible,
        string? modelosCompatibles,
        string? observaciones,
        bool activo)
    {
        CodigoInterno = codigoInterno.Trim().ToUpperInvariant();
        Nombre = nombre.Trim();
        TipoConsumible = tipoConsumible.Trim();
        Referencia = referencia.Trim();
        Color = color.Trim();
        UnidadMedida = unidadMedida.Trim();
        StockMinimo = stockMinimo;
        CostoUnitario = costoUnitario;
        MarcaCompatible = Normalize(marcaCompatible);
        ModelosCompatibles = Normalize(modelosCompatibles);
        Observaciones = Normalize(observaciones);
        Activo = activo;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void RegistrarEntrada(int cantidad)
    {
        StockActual += cantidad;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void RegistrarSalida(int cantidad)
    {
        StockActual -= cantidad;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void AjustarStock(int nuevoStock)
    {
        StockActual = nuevoStock;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
