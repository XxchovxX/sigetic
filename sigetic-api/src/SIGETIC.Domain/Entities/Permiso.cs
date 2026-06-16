namespace SIGETIC.Domain.Entities;

public sealed class Permiso
{
    private Permiso()
    {
    }

    public Permiso(
        string codigo,
        string modulo,
        string accion,
        string descripcion)
    {
        Id = Guid.NewGuid();
        Codigo = codigo.Trim();
        Modulo = modulo.Trim();
        Accion = accion.Trim();
        Descripcion = descripcion.Trim();
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Codigo { get; private set; } = string.Empty;

    public string Modulo { get; private set; } = string.Empty;

    public string Accion { get; private set; } = string.Empty;

    public string Descripcion { get; private set; } = string.Empty;

    public bool Activo { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }
}