namespace SIGETIC.Domain.Entities;

public sealed class FormacionOpcion
{
    private FormacionOpcion()
    {
    }

    public FormacionOpcion(
        Guid preguntaId,
        string texto,
        bool esCorrecta,
        int orden)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new ArgumentException("El texto de la opcion es obligatorio.");

        Id = Guid.NewGuid();
        PreguntaId = preguntaId;
        Texto = texto.Trim();
        EsCorrecta = esCorrecta;
        Orden = Math.Max(1, orden);
    }

    public Guid Id { get; private set; }
    public Guid PreguntaId { get; private set; }
    public string Texto { get; private set; } = string.Empty;
    public bool EsCorrecta { get; private set; }
    public int Orden { get; private set; }

    public FormacionPregunta? Pregunta { get; private set; }
}
