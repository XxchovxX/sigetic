namespace SIGETIC.Domain.Entities;

public sealed class FormacionPregunta
{
    private readonly List<FormacionOpcion> _opciones = new();

    private FormacionPregunta()
    {
    }

    public FormacionPregunta(
        Guid cursoId,
        string texto,
        string tipo,
        string? explicacion,
        int orden)
    {
        if (string.IsNullOrWhiteSpace(texto))
            throw new ArgumentException("El texto de la pregunta es obligatorio.");

        Id = Guid.NewGuid();
        CursoId = cursoId;
        Texto = texto.Trim();
        Tipo = NormalizarTipo(tipo);
        Explicacion = string.IsNullOrWhiteSpace(explicacion) ? null : explicacion.Trim();
        Orden = Math.Max(1, orden);
    }

    public Guid Id { get; private set; }
    public Guid CursoId { get; private set; }
    public string Texto { get; private set; } = string.Empty;
    public string Tipo { get; private set; } = "SeleccionUnica";
    public string? Explicacion { get; private set; }
    public int Orden { get; private set; }

    public FormacionCurso? Curso { get; private set; }
    public IReadOnlyCollection<FormacionOpcion> Opciones => _opciones;

    public bool EsCalificable => Tipo != "RespuestaLarga";

    public void AgregarOpcion(FormacionOpcion opcion)
    {
        _opciones.Add(opcion);
    }

    private static string NormalizarTipo(string? tipo)
    {
        return tipo switch
        {
            "SeleccionUnica" => "SeleccionUnica",
            "SeleccionMultiple" => "SeleccionMultiple",
            "VerdaderoFalso" => "VerdaderoFalso",
            "ListaDesplegable" => "ListaDesplegable",
            "RespuestaCorta" => "RespuestaCorta",
            "RespuestaLarga" => "RespuestaLarga",
            "Relacionar" => "Relacionar",
            _ => "SeleccionUnica"
        };
    }
}
