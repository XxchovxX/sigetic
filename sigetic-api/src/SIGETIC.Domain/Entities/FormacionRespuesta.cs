namespace SIGETIC.Domain.Entities;

public sealed class FormacionRespuesta
{
    private FormacionRespuesta()
    {
    }

    public FormacionRespuesta(
        Guid intentoId,
        Guid preguntaId,
        Guid? opcionId,
        string? respuestaTexto,
        string? datosRespuesta,
        bool? correcta)
    {
        Id = Guid.NewGuid();
        IntentoId = intentoId;
        PreguntaId = preguntaId;
        OpcionId = opcionId;
        RespuestaTexto = string.IsNullOrWhiteSpace(respuestaTexto) ? null : respuestaTexto.Trim();
        DatosRespuesta = string.IsNullOrWhiteSpace(datosRespuesta) ? null : datosRespuesta;
        Correcta = correcta;
    }

    public Guid Id { get; private set; }
    public Guid IntentoId { get; private set; }
    public Guid PreguntaId { get; private set; }
    public Guid? OpcionId { get; private set; }
    public string? RespuestaTexto { get; private set; }
    public string? DatosRespuesta { get; private set; }
    public bool? Correcta { get; private set; }

    public FormacionIntento? Intento { get; private set; }
    public FormacionPregunta? Pregunta { get; private set; }
    public FormacionOpcion? Opcion { get; private set; }
}
