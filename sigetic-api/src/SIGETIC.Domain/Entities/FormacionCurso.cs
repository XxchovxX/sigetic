namespace SIGETIC.Domain.Entities;

public sealed class FormacionCurso
{
    private readonly List<FormacionMaterial> _materiales = new();
    private readonly List<FormacionPregunta> _preguntas = new();
    private readonly List<FormacionIntento> _intentos = new();

    private FormacionCurso()
    {
    }

    public FormacionCurso(
        string titulo,
        string descripcion,
        string categoria,
        string dirigidoA,
        int duracionMinutos,
        int puntajeMinimo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("El titulo de la capacitacion es obligatorio.");

        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripcion de la capacitacion es obligatoria.");

        if (puntajeMinimo is < 1 or > 100)
            throw new ArgumentException("El puntaje minimo debe estar entre 1 y 100.");

        Id = Guid.NewGuid();
        Titulo = titulo.Trim();
        Descripcion = descripcion.Trim();
        Categoria = NormalizeOptional(categoria) ?? "General";
        DirigidoA = NormalizeOptional(dirigidoA) ?? "Funcionarios y contratistas";
        DuracionMinutos = Math.Max(1, duracionMinutos);
        PuntajeMinimo = puntajeMinimo;
        Activo = true;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string Titulo { get; private set; } = string.Empty;
    public string Descripcion { get; private set; } = string.Empty;
    public string Categoria { get; private set; } = string.Empty;
    public string DirigidoA { get; private set; } = string.Empty;
    public int DuracionMinutos { get; private set; }
    public int PuntajeMinimo { get; private set; }
    public bool Activo { get; private set; }
    public DateTime FechaCreacionUtc { get; private set; }
    public DateTime? FechaActualizacionUtc { get; private set; }

    public IReadOnlyCollection<FormacionMaterial> Materiales => _materiales;
    public IReadOnlyCollection<FormacionPregunta> Preguntas => _preguntas;
    public IReadOnlyCollection<FormacionIntento> Intentos => _intentos;

    public void Actualizar(
        string titulo,
        string descripcion,
        string categoria,
        string dirigidoA,
        int duracionMinutos,
        int puntajeMinimo,
        bool activo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
            throw new ArgumentException("El titulo de la capacitacion es obligatorio.");

        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripcion de la capacitacion es obligatoria.");

        if (puntajeMinimo is < 1 or > 100)
            throw new ArgumentException("El puntaje minimo debe estar entre 1 y 100.");

        Titulo = titulo.Trim();
        Descripcion = descripcion.Trim();
        Categoria = NormalizeOptional(categoria) ?? "General";
        DirigidoA = NormalizeOptional(dirigidoA) ?? "Funcionarios y contratistas";
        DuracionMinutos = Math.Max(1, duracionMinutos);
        PuntajeMinimo = puntajeMinimo;
        Activo = activo;
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void ReemplazarContenido(
        IEnumerable<FormacionMaterial> materiales,
        IEnumerable<FormacionPregunta> preguntas)
    {
        _materiales.Clear();
        _materiales.AddRange(materiales);

        _preguntas.Clear();
        _preguntas.AddRange(preguntas);

        FechaActualizacionUtc = DateTime.UtcNow;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
