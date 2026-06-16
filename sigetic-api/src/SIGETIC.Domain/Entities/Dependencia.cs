namespace SIGETIC.Domain.Entities;

public sealed class Dependencia
{
    private Dependencia()
    {
    }

    public Dependencia(
        string nombre,
        string codigo,
        string? responsable,
        string? correo)
    {
        Id = Guid.NewGuid();
        Nombre = nombre.Trim();
        Codigo = codigo.Trim().ToUpperInvariant();
        Responsable = string.IsNullOrWhiteSpace(responsable)
            ? null
            : responsable.Trim();
        Correo = string.IsNullOrWhiteSpace(correo)
            ? null
            : correo.Trim().ToLowerInvariant();
        Activa = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string Nombre { get; private set; } = string.Empty;

    public string Codigo { get; private set; } = string.Empty;

    public string? Responsable { get; private set; }

    public string? Correo { get; private set; }

    public bool Activa { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public void Actualizar(
        string nombre,
        string codigo,
        string? responsable,
        string? correo,
        bool activa)
    {
        Nombre = nombre.Trim();
        Codigo = codigo.Trim().ToUpperInvariant();
        Responsable = string.IsNullOrWhiteSpace(responsable)
            ? null
            : responsable.Trim();
        Correo = string.IsNullOrWhiteSpace(correo)
            ? null
            : correo.Trim().ToLowerInvariant();
        Activa = activa;
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}