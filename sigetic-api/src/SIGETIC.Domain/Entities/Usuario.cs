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

    public string? GoogleSubject { get; private set; }

    public Guid? DependenciaId { get; private set; }

    public string? Cargo { get; private set; }

    public string? TipoVinculacion { get; private set; }

    public Rol? Rol { get; private set; }

    public Dependencia? Dependencia { get; private set; }

    public bool EsCuentaGoogle => !string.IsNullOrWhiteSpace(GoogleSubject);

    public bool PerfilCompleto => !EsCuentaGoogle ||
        (DependenciaId.HasValue &&
         !string.IsNullOrWhiteSpace(Cargo) &&
         !string.IsNullOrWhiteSpace(TipoVinculacion));

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

    public void EnlazarGoogle(string googleSubject)
    {
        if (string.IsNullOrWhiteSpace(googleSubject))
            throw new ArgumentException("La identidad de Google es obligatoria.");

        GoogleSubject = googleSubject.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void CompletarPerfil(
        Guid dependenciaId,
        string cargo,
        string tipoVinculacion)
    {
        if (dependenciaId == Guid.Empty)
            throw new ArgumentException("La dependencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(cargo))
            throw new ArgumentException("El cargo es obligatorio.");

        if (string.IsNullOrWhiteSpace(tipoVinculacion))
            throw new ArgumentException("El tipo de vinculación es obligatorio.");

        DependenciaId = dependenciaId;
        Cargo = cargo.Trim();
        TipoVinculacion = tipoVinculacion.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}
