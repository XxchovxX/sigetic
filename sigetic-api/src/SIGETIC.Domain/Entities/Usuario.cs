namespace SIGETIC.Domain.Entities;

public sealed class Usuario
{
    private Usuario()
    {
    }

    public Usuario(
        string nombreCompleto,
        string correo,
        string passwordHash,
        Guid rolId)
    {
        Id = Guid.NewGuid();
        NombreCompleto = nombreCompleto.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        RolId = rolId;
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string NombreCompleto { get; private set; } = string.Empty;

    public string Correo { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public Guid RolId { get; private set; }

    public bool Activo { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public DateTime? UltimoAccesoUtc { get; private set; }

    public Rol? Rol { get; private set; }

    public void Actualizar(
        string nombreCompleto,
        string correo,
        Guid rolId,
        bool activo)
    {
        NombreCompleto = nombreCompleto.Trim();
        Correo = correo.Trim().ToLowerInvariant();
        RolId = rolId;
        Activo = activo;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void CambiarPassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void RegistrarAcceso()
    {
        UltimoAccesoUtc = DateTime.UtcNow;
    }
}