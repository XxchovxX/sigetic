namespace SIGETIC.Domain.Entities;

public sealed class FormacionRespuesta
{
    private FormacionRespuesta()
    {
    }

    public FormacionRespuesta(
        Guid intentoId,
        Guid preguntaId,
        Guid opcionId,
        bool correcta)
    {
        Id = Guid.NewGuid();
        IntentoId = intentoId;
        PreguntaId = preguntaId;
        OpcionId = opcionId;
        Correcta = correcta;
    }

    public Guid Id { get; private set; }
    public Guid IntentoId { get; private set; }
    public Guid PreguntaId { get; private set; }
    public Guid OpcionId { get; private set; }
    public bool Correcta { get; private set; }

    public FormacionIntento? Intento { get; private set; }
    public FormacionPregunta? Pregunta { get; private set; }
    public FormacionOpcion? Opcion { get; private set; }
}
