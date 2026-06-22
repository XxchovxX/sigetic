namespace SIGETIC.Domain.Entities;

public sealed class AuditoriaRegistro
{
    private AuditoriaRegistro()
    {
    }

    public AuditoriaRegistro(
        string modulo,
        string accion,
        string entidad,
        string? registroId,
        string usuario,
        string? rol,
        string? metodoHttp,
        string? ruta,
        string? direccionIp,
        string? resumen)
    {
        Id = Guid.NewGuid();
        Modulo = Normalize(modulo, 80);
        Accion = Normalize(accion, 80);
        Entidad = Normalize(entidad, 120);
        RegistroId = NormalizeNullable(registroId, 80);
        Usuario = Normalize(usuario, 180);
        Rol = NormalizeNullable(rol, 120);
        MetodoHttp = NormalizeNullable(metodoHttp, 20);
        Ruta = NormalizeNullable(ruta, 300);
        DireccionIp = NormalizeNullable(direccionIp, 80);
        Resumen = NormalizeNullable(resumen, 2000);
        FechaEventoUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Modulo { get; private set; } = string.Empty;
    public string Accion { get; private set; } = string.Empty;
    public string Entidad { get; private set; } = string.Empty;
    public string? RegistroId { get; private set; }
    public string Usuario { get; private set; } = string.Empty;
    public string? Rol { get; private set; }
    public string? MetodoHttp { get; private set; }
    public string? Ruta { get; private set; }
    public string? DireccionIp { get; private set; }
    public string? Resumen { get; private set; }
    public DateTime FechaEventoUtc { get; private set; }

    private static string Normalize(string value, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value)
            ? "No especificado"
            : value.Trim();

        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }

    private static string? NormalizeNullable(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();

        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }
}
