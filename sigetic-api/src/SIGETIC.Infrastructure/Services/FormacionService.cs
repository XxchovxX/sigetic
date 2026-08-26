using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Text;
using System.Text.Json;
using SIGETIC.Application.Formacion;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class FormacionService : IFormacionService
{
    private readonly SigeticDbContext _dbContext;

    public FormacionService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<DestinatariosFormacionResponse> GetDestinatariosAsync(
        CancellationToken cancellationToken)
    {
        var dependencias = await _dbContext.Dependencias
            .AsNoTracking()
            .Where(e => e.Activa)
            .OrderBy(e => e.Nombre)
            .Select(e => new DestinatarioDependenciaFormacionResponse(e.Id, e.Nombre))
            .ToListAsync(cancellationToken);

        var usuarios = await _dbContext.Usuarios
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Where(e => e.Activo)
            .OrderBy(e => e.NombreCompleto)
            .Select(e => new DestinatarioUsuarioFormacionResponse(
                e.Id,
                e.NombreCompleto,
                e.Correo,
                e.DependenciaId,
                e.Dependencia != null ? e.Dependencia.Nombre : null))
            .ToListAsync(cancellationToken);

        return new DestinatariosFormacionResponse(dependencias, usuarios);
    }

    public async Task<IReadOnlyList<CursoFormacionResponse>> GetCursosAsync(
        Guid usuarioId,
        bool incluirInactivos,
        CancellationToken cancellationToken)
    {
        var query = BaseCursoQuery();

        if (!incluirInactivos)
        {
            query = query.Where(e => e.Activo);

            var dependenciaId = await _dbContext.Usuarios
                .Where(e => e.Id == usuarioId)
                .Select(e => e.DependenciaId)
                .FirstOrDefaultAsync(cancellationToken);

            query = query.Where(e =>
                (!e.DependenciasDestino.Any() && !e.UsuariosDestino.Any()) ||
                e.UsuariosDestino.Any(destino => destino.UsuarioId == usuarioId) ||
                (dependenciaId.HasValue && e.DependenciasDestino.Any(
                    destino => destino.DependenciaId == dependenciaId.Value)));
        }

        var cursos = await query
            .OrderByDescending(e => e.Activo)
            .ThenBy(e => e.Categoria)
            .ThenBy(e => e.Titulo)
            .ToListAsync(cancellationToken);

        var intentos = await GetUltimosIntentosAsync(
            usuarioId,
            cursos.Select(e => e.Id).ToList(),
            cancellationToken);

        return cursos
            .Select(curso => ToCursoResponse(
                curso,
                intentos.GetValueOrDefault(curso.Id)))
            .ToList();
    }

    public async Task<CursoFormacionResponse?> GetCursoByIdAsync(
        Guid id,
        Guid usuarioId,
        bool incluirInactivos,
        CancellationToken cancellationToken)
    {
        var query = BaseCursoQuery();

        if (!incluirInactivos)
        {
            query = query.Where(e => e.Activo);

            var dependenciaId = await _dbContext.Usuarios
                .Where(e => e.Id == usuarioId)
                .Select(e => e.DependenciaId)
                .FirstOrDefaultAsync(cancellationToken);

            query = query.Where(e =>
                (!e.DependenciasDestino.Any() && !e.UsuariosDestino.Any()) ||
                e.UsuariosDestino.Any(destino => destino.UsuarioId == usuarioId) ||
                (dependenciaId.HasValue && e.DependenciasDestino.Any(
                    destino => destino.DependenciaId == dependenciaId.Value)));
        }

        var curso = await query.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (curso is null)
        {
            return null;
        }

        var ultimoIntento = await _dbContext.FormacionIntentos
            .AsNoTracking()
            .Include(e => e.Curso)
            .Where(e => e.CursoId == id && e.UsuarioId == usuarioId)
            .OrderByDescending(e => e.Aprobado && e.Puntaje >= 100)
            .ThenByDescending(e => e.FechaPresentacionUtc)
            .Select(e => ToIntentoResponse(e))
            .FirstOrDefaultAsync(cancellationToken);

        return ToCursoResponse(curso, ultimoIntento);
    }

    public async Task<CursoFormacionResponse> CreateCursoAsync(
        CrearCursoFormacionRequest request,
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        ValidateCurso(request.Materiales, request.Preguntas);
        await ValidateDestinatariosAsync(
            request.DependenciaIds,
            request.UsuarioIds,
            cancellationToken);

        var curso = new FormacionCurso(
            request.Titulo,
            request.Descripcion,
            request.Categoria,
            request.DirigidoA,
            request.EntidadCertificadora,
            request.DuracionMinutos,
            request.PuntajeMinimo);

        curso.ReemplazarContenido(
            BuildMateriales(curso.Id, request.Materiales),
            BuildPreguntas(curso.Id, request.Preguntas));
        curso.ReemplazarDestinatarios(request.DependenciaIds, request.UsuarioIds);

        _dbContext.FormacionCursos.Add(curso);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetCursoByIdAsync(
            curso.Id,
            usuarioId,
            incluirInactivos: true,
            cancellationToken) ?? throw new InvalidOperationException("No fue posible crear la capacitacion.");
    }

    public async Task<CursoFormacionResponse> UpdateCursoAsync(
        Guid id,
        ActualizarCursoFormacionRequest request,
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        ValidateCurso(request.Materiales, request.Preguntas);
        await ValidateDestinatariosAsync(
            request.DependenciaIds,
            request.UsuarioIds,
            cancellationToken);

        var curso = await _dbContext.FormacionCursos
            .Include(e => e.Materiales)
            .Include(e => e.Preguntas)
                .ThenInclude(e => e.Opciones)
            .Include(e => e.DependenciasDestino)
            .Include(e => e.UsuariosDestino)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (curso is null)
        {
            throw new KeyNotFoundException("No se encontro la capacitacion solicitada.");
        }

        curso.Actualizar(
            request.Titulo,
            request.Descripcion,
            request.Categoria,
            request.DirigidoA,
            request.EntidadCertificadora,
            request.DuracionMinutos,
            request.PuntajeMinimo,
            request.Activo);

        curso.ReemplazarContenido(
            BuildMateriales(curso.Id, request.Materiales),
            BuildPreguntas(curso.Id, request.Preguntas));
        curso.ReemplazarDestinatarios(request.DependenciaIds, request.UsuarioIds);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetCursoByIdAsync(
            curso.Id,
            usuarioId,
            incluirInactivos: true,
            cancellationToken) ?? throw new InvalidOperationException("No fue posible actualizar la capacitacion.");
    }

    public async Task<ResultadoEvaluacionFormacionResponse> ResponderEvaluacionAsync(
        Guid cursoId,
        ResponderEvaluacionFormacionRequest request,
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var participante = await _dbContext.Usuarios
            .AsNoTracking()
            .Where(e => e.Id == usuarioId)
            .Select(e => new
            {
                e.NombreCompleto,
                e.Correo,
                e.DependenciaId
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (participante is null)
        {
            throw new InvalidOperationException("No se encontro el perfil del usuario autenticado.");
        }

        var dependenciaId = participante.DependenciaId;

        var curso = await BaseCursoQuery()
            .Where(e =>
                (!e.DependenciasDestino.Any() && !e.UsuariosDestino.Any()) ||
                e.UsuariosDestino.Any(destino => destino.UsuarioId == usuarioId) ||
                (dependenciaId.HasValue && e.DependenciasDestino.Any(
                    destino => destino.DependenciaId == dependenciaId.Value)))
            .FirstOrDefaultAsync(e => e.Id == cursoId && e.Activo, cancellationToken);

        if (curso is null)
        {
            throw new KeyNotFoundException("No se encontro la capacitacion solicitada.");
        }

        if (curso.Preguntas.Count == 0)
        {
            throw new InvalidOperationException("La capacitacion no tiene evaluacion configurada.");
        }

        var yaCompletoPerfectamente = await _dbContext.FormacionIntentos
            .AsNoTracking()
            .AnyAsync(e =>
                e.CursoId == cursoId &&
                e.UsuarioId == usuarioId &&
                e.Aprobado &&
                e.Puntaje >= 100,
                cancellationToken);

        if (yaCompletoPerfectamente)
        {
            throw new InvalidOperationException(
                "Esta formacion ya fue completada con 100 %. No es necesario presentar nuevamente la evaluacion.");
        }

        var respuestas = request.Respuestas
            .GroupBy(e => e.PreguntaId)
            .Select(e => e.Last())
            .ToDictionary(e => e.PreguntaId);

        if (respuestas.Count != curso.Preguntas.Count)
        {
            throw new ArgumentException("Debe responder todas las preguntas de la evaluacion.");
        }

        var evaluadas = new List<RespuestaEvaluada>();
        var correctas = 0;
        var preguntasCalificables = curso.Preguntas.Count(e => e.EsCalificable);

        foreach (var pregunta in curso.Preguntas.OrderBy(e => e.Orden))
        {
            if (!respuestas.TryGetValue(pregunta.Id, out var respuesta))
            {
                throw new ArgumentException("Debe responder todas las preguntas de la evaluacion.");
            }

            var evaluada = EvaluarRespuesta(pregunta, respuesta);
            evaluadas.Add(evaluada);
            if (evaluada.Correcta == true) correctas++;
        }

        var puntaje = (int)Math.Round(correctas * 100m / preguntasCalificables, MidpointRounding.AwayFromZero);
        var aprobado = puntaje >= curso.PuntajeMinimo;
        var codigoCertificado = aprobado
            ? $"SIG-FOR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
            : null;

        var intento = new FormacionIntento(
            curso.Id,
            usuarioId,
            participante.NombreCompleto,
            participante.Correo,
            preguntasCalificables,
            correctas,
            puntaje,
            aprobado,
            codigoCertificado);

        foreach (var item in evaluadas)
        {
            intento.AgregarRespuesta(new FormacionRespuesta(
                intento.Id,
                item.PreguntaId,
                item.OpcionSeleccionadaId,
                item.RespuestaTexto,
                item.DatosRespuesta,
                item.Correcta));
        }

        _dbContext.FormacionIntentos.Add(intento);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ResultadoEvaluacionFormacionResponse(
            intento.Id,
            curso.Id,
            curso.Titulo,
            puntaje,
            curso.PuntajeMinimo,
            preguntasCalificables,
            correctas,
            aprobado,
            codigoCertificado,
            intento.FechaPresentacionUtc,
            evaluadas.Select(item => new ResultadoPreguntaFormacionResponse(
                item.PreguntaId,
                item.Pregunta,
                item.Tipo,
                item.OpcionSeleccionadaId,
                item.RespuestaVisible,
                item.Correcta,
                item.Explicacion)).ToList());
    }

    public async Task<IReadOnlyList<IntentoFormacionResumenResponse>> GetMisIntentosAsync(
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.FormacionIntentos
            .AsNoTracking()
            .Include(e => e.Curso)
            .Where(e => e.UsuarioId == usuarioId)
            .OrderByDescending(e => e.FechaPresentacionUtc)
            .Select(e => ToIntentoResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<CertificadoFormacionResponse?> GetCertificadoAsync(
        Guid intentoId,
        Guid usuarioId,
        bool puedeVerTodos,
        CancellationToken cancellationToken)
    {
        var intento = await _dbContext.FormacionIntentos
            .AsNoTracking()
            .Include(e => e.Curso)
            .FirstOrDefaultAsync(e =>
                e.Id == intentoId &&
                e.Aprobado &&
                (puedeVerTodos || e.UsuarioId == usuarioId),
                cancellationToken);

        if (intento is null || string.IsNullOrWhiteSpace(intento.CodigoCertificado))
        {
            return null;
        }

        var participante = await _dbContext.Usuarios
            .AsNoTracking()
            .Where(e => e.Id == intento.UsuarioId)
            .Select(e => new
            {
                e.NombreCompleto,
                e.Correo
            })
            .FirstOrDefaultAsync(cancellationToken);

        return new CertificadoFormacionResponse(
            intento.Id,
            intento.CursoId,
            intento.Curso?.Titulo ?? "Capacitacion SIGETIC",
            participante?.NombreCompleto ?? intento.ParticipanteNombre,
            participante?.Correo ?? intento.ParticipanteCorreo,
            intento.Curso?.Categoria ?? "Formacion institucional",
            intento.Curso?.DirigidoA ?? "Funcionarios y contratistas",
            intento.Curso?.EntidadCertificadora ?? "Secretaría de Planeación",
            intento.Curso?.DuracionMinutos ?? 0,
            intento.Puntaje,
            intento.Curso?.PuntajeMinimo ?? 0,
            intento.CodigoCertificado,
            intento.FechaPresentacionUtc);
    }

    private IQueryable<FormacionCurso> BaseCursoQuery()
    {
        return _dbContext.FormacionCursos
            .AsNoTracking()
            .Include(e => e.Materiales)
            .Include(e => e.Preguntas)
                .ThenInclude(e => e.Opciones)
            .Include(e => e.DependenciasDestino)
                .ThenInclude(e => e.Dependencia)
            .Include(e => e.UsuariosDestino)
                .ThenInclude(e => e.Usuario)
                    .ThenInclude(e => e!.Dependencia);
    }

    private async Task ValidateDestinatariosAsync(
        IReadOnlyList<Guid> dependenciaIds,
        IReadOnlyList<Guid> usuarioIds,
        CancellationToken cancellationToken)
    {
        var dependenciasSolicitadas = dependenciaIds.Distinct().ToList();
        var usuariosSolicitados = usuarioIds.Distinct().ToList();

        var dependenciasValidas = await _dbContext.Dependencias
            .CountAsync(e => dependenciasSolicitadas.Contains(e.Id) && e.Activa, cancellationToken);
        var usuariosValidos = await _dbContext.Usuarios
            .CountAsync(e => usuariosSolicitados.Contains(e.Id) && e.Activo, cancellationToken);

        if (dependenciasValidas != dependenciasSolicitadas.Count)
            throw new ArgumentException("Una de las dependencias seleccionadas no existe o está inactiva.");

        if (usuariosValidos != usuariosSolicitados.Count)
            throw new ArgumentException("Uno de los usuarios seleccionados no existe o está inactivo.");
    }

    private async Task<Dictionary<Guid, IntentoFormacionResumenResponse>> GetUltimosIntentosAsync(
        Guid usuarioId,
        IReadOnlyCollection<Guid> cursoIds,
        CancellationToken cancellationToken)
    {
        if (cursoIds.Count == 0)
        {
            return new Dictionary<Guid, IntentoFormacionResumenResponse>();
        }

        var intentos = await _dbContext.FormacionIntentos
            .AsNoTracking()
            .Include(e => e.Curso)
            .Where(e => e.UsuarioId == usuarioId && cursoIds.Contains(e.CursoId))
            .OrderByDescending(e => e.FechaPresentacionUtc)
            .ToListAsync(cancellationToken);

        return intentos
            .GroupBy(e => e.CursoId)
            .ToDictionary(
                e => e.Key,
                e => ToIntentoResponse(e
                    .OrderByDescending(item => item.Aprobado && item.Puntaje >= 100)
                    .ThenByDescending(item => item.FechaPresentacionUtc)
                    .First()));
    }

    private static List<FormacionMaterial> BuildMateriales(
        Guid cursoId,
        IReadOnlyList<CrearMaterialFormacionRequest> materiales)
    {
        return materiales
            .Where(e => !string.IsNullOrWhiteSpace(e.Titulo) && !string.IsNullOrWhiteSpace(e.Url))
            .Select((material, index) => new FormacionMaterial(
                cursoId,
                material.Titulo,
                material.Tipo,
                material.Url,
                index + 1))
            .ToList();
    }

    private static List<FormacionPregunta> BuildPreguntas(
        Guid cursoId,
        IReadOnlyList<CrearPreguntaFormacionRequest> preguntas)
    {
        var result = new List<FormacionPregunta>();

        foreach (var item in preguntas.Select((pregunta, index) => new { pregunta, index }))
        {
            var pregunta = new FormacionPregunta(
                cursoId,
                item.pregunta.Texto,
                item.pregunta.Tipo,
                item.pregunta.Explicacion,
                item.index + 1);

            foreach (var opcion in item.pregunta.Opciones.Select((opcion, index) => new { opcion, index }))
            {
                pregunta.AgregarOpcion(new FormacionOpcion(
                    pregunta.Id,
                    opcion.opcion.Texto,
                    opcion.opcion.TextoRelacionado,
                    opcion.opcion.EsCorrecta,
                    opcion.index + 1));
            }

            result.Add(pregunta);
        }

        return result;
    }

    private static void ValidateCurso(
        IReadOnlyList<CrearMaterialFormacionRequest> materiales,
        IReadOnlyList<CrearPreguntaFormacionRequest> preguntas)
    {
        if (materiales.Count == 0 || materiales.Any(e => string.IsNullOrWhiteSpace(e.Titulo) || string.IsNullOrWhiteSpace(e.Url)))
        {
            throw new ArgumentException("Debe registrar al menos un material con titulo y URL.");
        }

        if (preguntas.Count == 0)
        {
            throw new ArgumentException("Debe registrar al menos una pregunta de evaluacion.");
        }

        foreach (var pregunta in preguntas)
        {
            if (string.IsNullOrWhiteSpace(pregunta.Texto))
            {
                throw new ArgumentException("Todas las preguntas deben tener texto.");
            }

            ValidatePregunta(pregunta);
        }

        if (preguntas.All(e => e.Tipo == "RespuestaLarga"))
            throw new ArgumentException("La evaluación debe incluir al menos una pregunta calificable.");
    }

    private static void ValidatePregunta(CrearPreguntaFormacionRequest pregunta)
    {
        var opcionesConTexto = pregunta.Opciones
            .Where(e => !string.IsNullOrWhiteSpace(e.Texto))
            .ToList();

        switch (pregunta.Tipo)
        {
            case "SeleccionUnica":
            case "ListaDesplegable":
                if (opcionesConTexto.Count < 4)
                    throw new ArgumentException("Las preguntas de selección deben tener al menos cuatro opciones.");
                if (opcionesConTexto.Count(e => e.EsCorrecta) != 1)
                    throw new ArgumentException("La selección única debe tener exactamente una respuesta correcta.");
                break;

            case "SeleccionMultiple":
                if (opcionesConTexto.Count < 4)
                    throw new ArgumentException("La selección múltiple debe tener al menos cuatro opciones.");
                if (opcionesConTexto.Count(e => e.EsCorrecta) < 2)
                    throw new ArgumentException("La selección múltiple debe tener al menos dos respuestas correctas.");
                break;

            case "VerdaderoFalso":
                if (opcionesConTexto.Count != 2 || opcionesConTexto.Count(e => e.EsCorrecta) != 1)
                    throw new ArgumentException("Verdadero o falso debe tener dos opciones y una respuesta correcta.");
                break;

            case "RespuestaCorta":
                if (opcionesConTexto.Count == 0)
                    throw new ArgumentException("La respuesta corta debe incluir al menos una respuesta aceptada.");
                break;

            case "RespuestaLarga":
                if (pregunta.Opciones.Count > 0)
                    throw new ArgumentException("La respuesta larga no utiliza opciones.");
                break;

            case "Relacionar":
                if (opcionesConTexto.Count < 2 || opcionesConTexto.Any(e => string.IsNullOrWhiteSpace(e.TextoRelacionado)))
                    throw new ArgumentException("Relacionar requiere al menos dos pares completos.");
                break;

            default:
                throw new ArgumentException("Selecciona un tipo de pregunta válido.");
        }
    }

    private static RespuestaEvaluada EvaluarRespuesta(
        FormacionPregunta pregunta,
        RespuestaEvaluacionFormacionRequest respuesta)
    {
        switch (pregunta.Tipo)
        {
            case "SeleccionUnica":
            case "ListaDesplegable":
            case "VerdaderoFalso":
            {
                if (!respuesta.OpcionId.HasValue)
                    throw new ArgumentException($"Debes responder: {pregunta.Texto}");

                var opcion = pregunta.Opciones.FirstOrDefault(e => e.Id == respuesta.OpcionId.Value)
                    ?? throw new ArgumentException("Una respuesta seleccionada no pertenece a la pregunta.");
                return new RespuestaEvaluada(
                    pregunta.Id, pregunta.Texto, pregunta.Tipo, opcion.Id,
                    null, null, opcion.Texto, opcion.EsCorrecta, pregunta.Explicacion);
            }

            case "SeleccionMultiple":
            {
                var seleccionadas = (respuesta.OpcionIds ?? Array.Empty<Guid>()).Distinct().ToHashSet();
                if (seleccionadas.Count == 0)
                    throw new ArgumentException($"Debes seleccionar al menos una opción en: {pregunta.Texto}");
                if (seleccionadas.Any(id => pregunta.Opciones.All(e => e.Id != id)))
                    throw new ArgumentException("Una respuesta seleccionada no pertenece a la pregunta.");

                var correctas = pregunta.Opciones.Where(e => e.EsCorrecta).Select(e => e.Id).ToHashSet();
                var textos = pregunta.Opciones.Where(e => seleccionadas.Contains(e.Id)).OrderBy(e => e.Orden).Select(e => e.Texto);
                return new RespuestaEvaluada(
                    pregunta.Id, pregunta.Texto, pregunta.Tipo, null,
                    null, JsonSerializer.Serialize(seleccionadas), string.Join(", ", textos),
                    seleccionadas.SetEquals(correctas), pregunta.Explicacion);
            }

            case "RespuestaCorta":
            {
                var texto = respuesta.Texto?.Trim();
                if (string.IsNullOrWhiteSpace(texto))
                    throw new ArgumentException($"Debes responder: {pregunta.Texto}");
                var correcta = pregunta.Opciones.Any(e => NormalizarRespuesta(e.Texto) == NormalizarRespuesta(texto));
                return new RespuestaEvaluada(
                    pregunta.Id, pregunta.Texto, pregunta.Tipo, null,
                    texto, null, texto, correcta, pregunta.Explicacion);
            }

            case "RespuestaLarga":
            {
                var texto = respuesta.Texto?.Trim();
                if (string.IsNullOrWhiteSpace(texto))
                    throw new ArgumentException($"Debes responder: {pregunta.Texto}");
                return new RespuestaEvaluada(
                    pregunta.Id, pregunta.Texto, pregunta.Tipo, null,
                    texto, null, texto, null, pregunta.Explicacion);
            }

            case "Relacionar":
            {
                var relaciones = respuesta.Relaciones ?? Array.Empty<RelacionEvaluacionFormacionRequest>();
                var porItem = relaciones.GroupBy(e => e.ItemId).Select(e => e.Last()).ToList();
                if (porItem.Count != pregunta.Opciones.Count)
                    throw new ArgumentException($"Debes completar todas las relaciones en: {pregunta.Texto}");

                var ids = pregunta.Opciones.Select(e => e.Id).ToHashSet();
                if (porItem.Any(e => !ids.Contains(e.ItemId) || !ids.Contains(e.RelacionId)))
                    throw new ArgumentException("Una relación no pertenece a la pregunta.");

                var correcta = porItem.All(e => e.ItemId == e.RelacionId) &&
                    porItem.Select(e => e.RelacionId).Distinct().Count() == pregunta.Opciones.Count;
                var visibles = porItem.Select(item =>
                {
                    var izquierda = pregunta.Opciones.First(e => e.Id == item.ItemId).Texto;
                    var derecha = pregunta.Opciones.First(e => e.Id == item.RelacionId).TextoRelacionado;
                    return $"{izquierda}: {derecha}";
                });
                return new RespuestaEvaluada(
                    pregunta.Id, pregunta.Texto, pregunta.Tipo, null,
                    null, JsonSerializer.Serialize(porItem), string.Join("; ", visibles),
                    correcta, pregunta.Explicacion);
            }

            default:
                throw new ArgumentException("La evaluación contiene un tipo de pregunta no compatible.");
        }
    }

    private static string NormalizarRespuesta(string value)
    {
        var decomposed = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);
        var previousWasSpace = false;

        foreach (var character in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
                continue;

            if (char.IsWhiteSpace(character))
            {
                if (!previousWasSpace) builder.Append(' ');
                previousWasSpace = true;
            }
            else
            {
                builder.Append(character);
                previousWasSpace = false;
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    private sealed record RespuestaEvaluada(
        Guid PreguntaId,
        string Pregunta,
        string Tipo,
        Guid? OpcionSeleccionadaId,
        string? RespuestaTexto,
        string? DatosRespuesta,
        string RespuestaVisible,
        bool? Correcta,
        string? Explicacion);

    private static CursoFormacionResponse ToCursoResponse(
        FormacionCurso curso,
        IntentoFormacionResumenResponse? ultimoIntento)
    {
        return new CursoFormacionResponse(
            curso.Id,
            curso.Titulo,
            curso.Descripcion,
            curso.Categoria,
            curso.DirigidoA,
            curso.EntidadCertificadora,
            curso.DuracionMinutos,
            curso.PuntajeMinimo,
            curso.Activo,
            curso.FechaCreacionUtc,
            curso.FechaActualizacionUtc,
            curso.DependenciasDestino
                .Where(e => e.Dependencia != null)
                .OrderBy(e => e.Dependencia!.Nombre)
                .Select(e => new DestinatarioDependenciaFormacionResponse(
                    e.DependenciaId,
                    e.Dependencia!.Nombre))
                .ToList(),
            curso.UsuariosDestino
                .Where(e => e.Usuario != null)
                .OrderBy(e => e.Usuario!.NombreCompleto)
                .Select(e => new DestinatarioUsuarioFormacionResponse(
                    e.UsuarioId,
                    e.Usuario!.NombreCompleto,
                    e.Usuario.Correo,
                    e.Usuario.DependenciaId,
                    e.Usuario.Dependencia?.Nombre))
                .ToList(),
            curso.Materiales
                .OrderBy(e => e.Orden)
                .Select(e => new MaterialFormacionResponse(
                    e.Id,
                    e.Titulo,
                    e.Tipo,
                    e.Url,
                    e.Orden))
                .ToList(),
            curso.Preguntas
                .OrderBy(e => e.Orden)
                .Select(e => new PreguntaFormacionResponse(
                    e.Id,
                    e.Texto,
                    e.Tipo,
                    e.Explicacion,
                    e.Orden,
                    (e.Tipo == "RespuestaCorta"
                        ? Enumerable.Empty<FormacionOpcion>()
                        : e.Opciones)
                        .OrderBy(option => option.Orden)
                        .Select(option => new OpcionFormacionResponse(
                            option.Id,
                            option.Texto,
                            option.TextoRelacionado,
                            option.Orden))
                        .ToList()))
                .ToList(),
            ultimoIntento);
    }

    private static IntentoFormacionResumenResponse ToIntentoResponse(FormacionIntento intento)
    {
        return new IntentoFormacionResumenResponse(
            intento.Id,
            intento.CursoId,
            intento.Curso?.Titulo ?? "Capacitacion SIGETIC",
            intento.TotalPreguntas,
            intento.RespuestasCorrectas,
            intento.Puntaje,
            intento.Aprobado,
            intento.CodigoCertificado,
            intento.FechaPresentacionUtc);
    }
}
