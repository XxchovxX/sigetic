namespace SIGETIC.Domain.Entities;

public sealed class FormacionMaterial
{
    private FormacionMaterial()
    {
    }

    public FormacionMaterial(
        Guid cursoId,
        string titulo,
        string tipo,
        string url,
        int orden)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("El titulo del material es obligatorio.");

        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("La URL del material es obligatoria.");

        Id = Guid.NewGuid();
        CursoId = cursoId;
        Titulo = titulo.Trim();
        Tipo = string.IsNullOrWhiteSpace(tipo) ? "Enlace" : tipo.Trim();
        Url = url.Trim();
        Orden = Math.Max(1, orden);
    }

    public Guid Id { get; private set; }
    public Guid CursoId { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string Tipo { get; private set; } = string.Empty;
    public string Url { get; private set; } = string.Empty;
    public int Orden { get; private set; }

    public FormacionCurso? Curso { get; private set; }
}
