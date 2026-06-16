namespace SIGETIC.Domain.Entities;

public sealed class Funcionario
{
    private Funcionario()
    {
    }

    public Funcionario(
        string nombreCompleto,
        string documento,
        string cargo,
        Guid dependenciaId,
        string? correo,
        string? telefono)
    {
        Id = Guid.NewGuid();
        NombreCompleto = nombreCompleto.Trim();
        Documento = documento.Trim();
        Cargo = cargo.Trim();
        DependenciaId = dependenciaId;
        Correo = string.IsNullOrWhiteSpace(correo)
            ? null
            : correo.Trim().ToLowerInvariant();
        Telefono = string.IsNullOrWhiteSpace(telefono)
            ? null
            : telefono.Trim();
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string NombreCompleto { get; private set; } = string.Empty;

    public string Documento { get; private set; } = string.Empty;

    public string Cargo { get; private set; } = string.Empty;

    public Guid DependenciaId { get; private set; }

    public string? Correo { get; private set; }

    public string? Telefono { get; private set; }

    public bool Activo { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public Dependencia? Dependencia { get; private set; }

    public void Actualizar(
        string nombreCompleto,
        string documento,
        string cargo,
        Guid dependenciaId,
        string? correo,
        string? telefono,
        bool activo)
    {
        NombreCompleto = nombreCompleto.Trim();
        Documento = documento.Trim();
        Cargo = cargo.Trim();
        DependenciaId = dependenciaId;
        Correo = string.IsNullOrWhiteSpace(correo)
            ? null
            : correo.Trim().ToLowerInvariant();
        Telefono = string.IsNullOrWhiteSpace(telefono)
            ? null
            : telefono.Trim();
        Activo = activo;
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}