namespace SIGETIC.Domain.Entities;

public sealed class FormacionIntento
{
    private readonly List<FormacionRespuesta> _respuestas = new();

    private FormacionIntento()
    {
    }

    public FormacionIntento(
        Guid cursoId,
        Guid usuarioId,
        string participanteNombre,
        string participanteCorreo,
        int totalPreguntas,
        int respuestasCorrectas,
        int puntaje,
        bool aprobado,
        string? codigoCertificado)
    {
        Id = Guid.NewGuid();
        CursoId = cursoId;
        UsuarioId = usuarioId;
        ParticipanteNombre = participanteNombre.Trim();
        ParticipanteCorreo = participanteCorreo.Trim();
        TotalPreguntas = totalPreguntas;
        RespuestasCorrectas = respuestasCorrectas;
        Puntaje = puntaje;
        Aprobado = aprobado;
        CodigoCertificado = codigoCertificado;
        FechaPresentacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public Guid CursoId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string ParticipanteNombre { get; private set; } = string.Empty;
    public string ParticipanteCorreo { get; private set; } = string.Empty;
    public int TotalPreguntas { get; private set; }
    public int RespuestasCorrectas { get; private set; }
    public int Puntaje { get; private set; }
    public bool Aprobado { get; private set; }
    public string? CodigoCertificado { get; private set; }
    public DateTime FechaPresentacionUtc { get; private set; }

    public FormacionCurso? Curso { get; private set; }
    public IReadOnlyCollection<FormacionRespuesta> Respuestas => _respuestas;

    public void AgregarRespuesta(FormacionRespuesta respuesta)
    {
        _respuestas.Add(respuesta);
    }
}
