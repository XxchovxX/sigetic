namespace SIGETIC.Application.Formacion;

public sealed record CrearCursoFormacionRequest(
    string Titulo,
    string Descripcion,
    string Categoria,
    string DirigidoA,
    int DuracionMinutos,
    int PuntajeMinimo,
    IReadOnlyList<Guid> DependenciaIds,
    IReadOnlyList<Guid> UsuarioIds,
    IReadOnlyList<CrearMaterialFormacionRequest> Materiales,
    IReadOnlyList<CrearPreguntaFormacionRequest> Preguntas
);

public sealed record ActualizarCursoFormacionRequest(
    string Titulo,
    string Descripcion,
    string Categoria,
    string DirigidoA,
    int DuracionMinutos,
    int PuntajeMinimo,
    bool Activo,
    IReadOnlyList<Guid> DependenciaIds,
    IReadOnlyList<Guid> UsuarioIds,
    IReadOnlyList<CrearMaterialFormacionRequest> Materiales,
    IReadOnlyList<CrearPreguntaFormacionRequest> Preguntas
);

public sealed record CrearMaterialFormacionRequest(
    string Titulo,
    string Tipo,
    string Url
);

public sealed record CrearPreguntaFormacionRequest(
    string Texto,
    string? Explicacion,
    IReadOnlyList<CrearOpcionFormacionRequest> Opciones
);

public sealed record CrearOpcionFormacionRequest(
    string Texto,
    bool EsCorrecta
);

public sealed record ResponderEvaluacionFormacionRequest(
    IReadOnlyList<RespuestaEvaluacionFormacionRequest> Respuestas
);

public sealed record RespuestaEvaluacionFormacionRequest(
    Guid PreguntaId,
    Guid OpcionId
);

public sealed record CursoFormacionResponse(
    Guid Id,
    string Titulo,
    string Descripcion,
    string Categoria,
    string DirigidoA,
    int DuracionMinutos,
    int PuntajeMinimo,
    bool Activo,
    DateTime FechaCreacionUtc,
    DateTime? FechaActualizacionUtc,
    IReadOnlyList<DestinatarioDependenciaFormacionResponse> DependenciasDestino,
    IReadOnlyList<DestinatarioUsuarioFormacionResponse> UsuariosDestino,
    IReadOnlyList<MaterialFormacionResponse> Materiales,
    IReadOnlyList<PreguntaFormacionResponse> Preguntas,
    IntentoFormacionResumenResponse? UltimoIntento
);

public sealed record DestinatarioDependenciaFormacionResponse(Guid Id, string Nombre);

public sealed record DestinatarioUsuarioFormacionResponse(
    Guid Id,
    string NombreCompleto,
    string Correo,
    Guid? DependenciaId,
    string? Dependencia
);

public sealed record DestinatariosFormacionResponse(
    IReadOnlyList<DestinatarioDependenciaFormacionResponse> Dependencias,
    IReadOnlyList<DestinatarioUsuarioFormacionResponse> Usuarios
);

public sealed record MaterialFormacionResponse(
    Guid Id,
    string Titulo,
    string Tipo,
    string Url,
    int Orden
);

public sealed record PreguntaFormacionResponse(
    Guid Id,
    string Texto,
    string? Explicacion,
    int Orden,
    IReadOnlyList<OpcionFormacionResponse> Opciones
);

public sealed record OpcionFormacionResponse(
    Guid Id,
    string Texto,
    int Orden
);

public sealed record IntentoFormacionResumenResponse(
    Guid Id,
    Guid CursoId,
    string CursoTitulo,
    int TotalPreguntas,
    int RespuestasCorrectas,
    int Puntaje,
    bool Aprobado,
    string? CodigoCertificado,
    DateTime FechaPresentacionUtc
);

public sealed record ResultadoEvaluacionFormacionResponse(
    Guid IntentoId,
    Guid CursoId,
    string CursoTitulo,
    int Puntaje,
    int PuntajeMinimo,
    int TotalPreguntas,
    int RespuestasCorrectas,
    bool Aprobado,
    string? CodigoCertificado,
    DateTime FechaPresentacionUtc,
    IReadOnlyList<ResultadoPreguntaFormacionResponse> Detalle
);

public sealed record ResultadoPreguntaFormacionResponse(
    Guid PreguntaId,
    string Pregunta,
    Guid OpcionSeleccionadaId,
    string OpcionSeleccionada,
    bool Correcta,
    string? Explicacion
);

public sealed record CertificadoFormacionResponse(
    Guid IntentoId,
    Guid CursoId,
    string CursoTitulo,
    string ParticipanteNombre,
    string ParticipanteCorreo,
    string Categoria,
    string DirigidoA,
    int DuracionMinutos,
    int Puntaje,
    int PuntajeMinimo,
    string CodigoCertificado,
    DateTime FechaPresentacionUtc
);
