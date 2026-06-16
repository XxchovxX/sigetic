namespace SIGETIC.Domain.Entities;

public sealed class Rol
{
    private Rol()
    {
    }

    public Rol(string nombre, string descripcion, bool esSistema = false)
    {
        Id = Guid.NewGuid();
        Nombre = nombre.Trim();
        Descripcion = descripcion.Trim();
        EsSistema = esSistema;
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Nombre { get; private set; } = string.Empty;

    public string Descripcion { get; private set; } = string.Empty;

    public bool EsSistema { get; private set; }

    public bool Activo { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public void Actualizar(string nombre, string descripcion, bool activo)
    {
        if (EsSistema && !activo)
        {
            throw new InvalidOperationException(
                "No se puede desactivar un rol del sistema.");
        }

        Nombre = nombre.Trim();
        Descripcion = descripcion.Trim();
        Activo = activo;
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}