using SIGETIC.Domain.Entities;

namespace SIGETIC.Api.Firmas;

internal sealed record CampoTh122(string Etiqueta, string Guia, string Tipo = "texto", string[]? Opciones = null, bool Requerido = false);
internal sealed record SeccionTh122(string Id, string Titulo, string Guia, CampoTh122[] Campos, bool Repetible = false, string[][]? Ejemplos = null);

internal static class PlantillaTh122
{
    public const string Titulo = "Formato de identificación, retención y transferencia del conocimiento institucional";
    public static readonly SeccionTh122[] Secciones =
    [
        new("general", "1. Información general", "",
        [
            new("Dependencia", "Secretaría, oficina o dependencia a la que pertenece.", Requerido: true),
            new("Tipo de vinculación", "Servidor público / Contratista.", "lista", ["Servidor público", "Contratista"], true),
            new("Nombre completo", "Nombre de quien entrega el conocimiento, tomado de su cuenta.", "automatico"),
            new("Cargo o actividad contractual", "Cargo desempeñado o denominación del objeto contractual.", Requerido: true),
            new("Fecha de ingreso o inicio del contrato", "Fecha de inicio de la vinculación.", "fecha", Requerido: true),
            new("Fecha de retiro o terminación", "Fecha de finalización.", "fecha"),
            new("Jefe inmediato o supervisor", "Nombre del responsable de verificar la entrega.", Requerido: true),
            new("Persona que recibe", "Se toma de la cuenta de SIGETIC indicada arriba.", "automatico"),
            new("Fecha de elaboración", "Fecha en que se diligencia el formato.", "fecha", Requerido: true)
        ]),
        new("actividades", "2. Identificación de las actividades y conocimientos desarrollados",
            "Relaciona las actividades principales y los conocimientos técnicos, normativos, administrativos u operativos que se necesitan para realizarlas. Clasifica la frecuencia y la importancia según el impacto de perder ese conocimiento.",
        [
            new("Actividad o proceso", ""), new("Descripción del conocimiento adquirido", ""),
            new("Frecuencia", ""), new("Importancia", "", "lista", ["Alta", "Media", "Baja"])
        ], true,
        [
            ["Gestión del reporte FURAG", "Diligenciamiento, recopilación de evidencias y seguimiento de las políticas MIPG.", "Anual", "Alta"],
            ["Gestión de plataformas institucionales", "Manejo de usuarios, actualización de información y generación de reportes.", "Permanente", "Alta"]
        ]),
        new("critico", "3. Identificación del conocimiento crítico", "",
        [
            new("Conocimiento crítico identificado", ""), new("¿Por qué es importante para la entidad?", ""),
            new("¿Está documentado?", "", "lista", ["Sí", "Parcial", "No"]), new("¿Dónde se encuentra?", "")
        ], true,
        [
            ["Manejo de plataforma SUIT", "Permite actualizar y gestionar los trámites y servicios institucionales.", "Sí / Parcial / No", "Carpeta institucional / Plataforma."],
            ["Elaboración de informes de seguimiento", "Permite cumplir los reportes y compromisos institucionales.", "Sí / Parcial / No", "Carpeta de Planeación."]
        ]),
        new("recursos", "4. Documentación del conocimiento y recursos utilizados",
            "Relaciona los recursos necesarios para continuar las actividades. Evita incluir contraseñas o credenciales de acceso.",
        [
            new("Documento, herramienta o recurso", ""), new("Descripción o utilidad", ""),
            new("Ubicación o enlace", ""), new("Estado", "")
        ], true,
        [
            ["Procedimientos", "Documentos que explican cómo desarrollar las actividades.", "Carpeta compartida.", "Actualizado / Por actualizar."],
            ["Bases de datos", "Información utilizada para desarrollar las actividades.", "Carpeta institucional.", "Actualizada / Pendiente."],
            ["Plataformas", "Sistemas de información utilizados.", "URL o nombre de plataforma.", "Acceso disponible / Pendiente."],
            ["Informes", "Informes periódicos y reportes elaborados.", "Archivo de gestión.", "Entregado / Pendiente."],
            ["Normatividad", "Leyes, decretos, resoluciones y lineamientos aplicables.", "Carpeta normativa.", "Actualizada / Por actualizar."]
        ]),
        new("lecciones", "5. Lecciones aprendidas y experiencias adquiridas", "",
        [
            new("Dificultades frecuentes", "¿Qué inconvenientes se presentan? Ejemplo: entrega tardía de insumos para los informes de seguimiento MIPG."),
            new("Soluciones implementadas", "¿Qué acciones ayudaron? Ejemplo: solicitar las evidencias con anticipación para consolidar los informes a tiempo."),
            new("Buenas prácticas", "¿Qué facilitaría el trabajo? Ejemplo: dejar margen suficiente para que las dependencias entreguen la información."),
            new("Riesgos identificados", "¿Qué puede ocasionar errores o retrasos? Ejemplo: envío de información a entes de control fuera del plazo.")
        ]),
        new("pendientes", "6. Estado de actividades, trámites y compromisos pendientes",
            "Identifica qué asuntos requieren atención después del retiro o de la terminación del contrato.",
        [
            new("Actividad o compromiso pendiente", ""), new("Estado actual", ""), new("Fecha límite", "", "fecha"),
            new("Responsable de continuar", ""), new("Observaciones", "")
        ], true,
        [
            ["Actualización de matriz de riesgos", "En ejecución", "15/12/2026", "Servidor designado", "Pendiente revisión de las dependencias."],
            ["Elaboración de informe", "Pendiente", "20/12/2026", "Responsable designado", "Se cuenta con información parcial."]
        ]),
        new("transferencia", "7. Transferencia del conocimiento",
            "Selecciona el mecanismo que mejor transmita el conocimiento: reunión de empalme, capacitación, acompañamiento, manual, video, entrega documental o sistematización de buenas prácticas.",
        [
            new("Conocimiento o actividad transferida", ""), new("Mecanismo utilizado", ""),
            new("Persona que recibe", ""), new("Fecha", "", "fecha"), new("Resultado", "")
        ], true,
        [
            ["Elaboración de informes", "Capacitación o acompañamiento", "Nombre del servidor", "Fecha", "Comprendido."],
            ["Desarrollo de procedimiento", "Entrega de instructivo", "Nombre del servidor", "Fecha", "Documento entregado."]
        ]),
        new("continuidad", "8. Recomendaciones para garantizar la continuidad del conocimiento", "",
        [
            new("Recomendaciones", "Indica qué debe tener presente quien asume las actividades, qué plazos debe recordar, a qué debe prestar especial atención y qué errores conviene evitar.")
        ])
    ];

    public static IReadOnlyList<(SeccionTh122 Seccion, string[][] Filas)> Normalizar(
        Dictionary<string, string[][]> datos, Usuario entrega, Usuario recibe)
    {
        if (datos.Keys.Any(id => !Secciones.Any(s => s.Id == id)))
            throw new ErrorFirma(400, "El formulario contiene una sección desconocida.");
        return Secciones.Select(seccion =>
        {
            var filas = datos.GetValueOrDefault(seccion.Id) ?? [];
            if (filas.Length > (seccion.Repetible ? 20 : 1))
                throw new ErrorFirma(400, $"Hay demasiados registros en {seccion.Titulo}.");
            if (!seccion.Repetible && filas.Length == 0)
                filas = [new string[seccion.Campos.Length]];
            var normalizadas = filas.Select(fila =>
            {
                if (fila is null || fila.Length != seccion.Campos.Length)
                    throw new ErrorFirma(400, $"Revisa los campos de {seccion.Titulo}.");
                return seccion.Campos.Select((campo, i) =>
                {
                    var valor = campo.Tipo == "automatico"
                        ? (i == 2 ? entrega.NombreCompleto : recibe.NombreCompleto)
                        : fila[i]?.Trim() ?? "";
                    if (valor.Length > 600 || valor.Any(c => char.IsControl(c) && c is not ('\n' or '\r' or '\t')))
                        throw new ErrorFirma(400, $"Revisa el contenido de «{campo.Etiqueta}». El máximo es 600 caracteres.");
                    if (valor.Length == 0 && campo.Requerido)
                        throw new ErrorFirma(400, $"Diligencia «{campo.Etiqueta}».");
                    if (valor.Length > 0 && campo.Tipo == "fecha")
                    {
                        if (!DateOnly.TryParseExact(valor, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture,
                                System.Globalization.DateTimeStyles.None, out var fecha))
                            throw new ErrorFirma(400, $"Indica una fecha válida en «{campo.Etiqueta}».");
                        return fecha.ToString("dd/MM/yyyy", System.Globalization.CultureInfo.InvariantCulture);
                    }
                    if (valor.Length > 0 && campo.Opciones is { } opciones && !opciones.Contains(valor))
                        throw new ErrorFirma(400, $"Selecciona una opción válida en «{campo.Etiqueta}».");
                    return valor;
                }).ToArray();
            }).Where(fila => fila.Any(value => value.Length > 0)).ToArray();
            return (seccion, normalizadas);
        }).ToArray();
    }
}
