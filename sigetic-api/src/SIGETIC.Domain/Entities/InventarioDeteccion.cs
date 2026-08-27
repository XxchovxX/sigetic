namespace SIGETIC.Domain.Entities;

public sealed class InventarioDeteccion
{
    private InventarioDeteccion()
    {
    }

    public InventarioDeteccion(
        Guid usuarioId,
        string tokenHash,
        DateTime expiraUtc)
    {
        Id = Guid.NewGuid();
        UsuarioId = usuarioId;
        TokenHash = tokenHash;
        Estado = "Pendiente";
        FechaCreacionUtc = DateTime.UtcNow;
        ExpiraUtc = expiraUtc;
    }

    public Guid Id { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string TokenHash { get; private set; } = string.Empty;
    public string Estado { get; private set; } = string.Empty;
    public string? DatosJson { get; private set; }
    public string? DireccionIpOrigen { get; private set; }
    public DateTime FechaCreacionUtc { get; private set; }
    public DateTime ExpiraUtc { get; private set; }
    public DateTime? FechaRecepcionUtc { get; private set; }

    public Usuario? Usuario { get; private set; }

    public bool EstaExpirada(DateTime ahoraUtc) => ExpiraUtc <= ahoraUtc;

    public void RegistrarDatos(string datosJson, string? direccionIpOrigen)
    {
        if (Estado != "Pendiente")
            throw new InvalidOperationException("Esta deteccion ya fue utilizada.");

        if (EstaExpirada(DateTime.UtcNow))
            throw new InvalidOperationException("El codigo de deteccion ya expiro.");

        DatosJson = datosJson;
        DireccionIpOrigen = string.IsNullOrWhiteSpace(direccionIpOrigen)
            ? null
            : direccionIpOrigen.Trim();
        Estado = "Recibida";
        FechaRecepcionUtc = DateTime.UtcNow;
    }
}
