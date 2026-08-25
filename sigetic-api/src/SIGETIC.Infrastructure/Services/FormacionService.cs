using Microsoft.EntityFrameworkCore;
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
            .OrderByDescending(e => e.FechaPresentacionUtc)
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
        string participanteNombre,
        string participanteCorreo,
        CancellationToken cancellationToken)
    {
        var dependenciaId = await _dbContext.Usuarios
            .Where(e => e.Id == usuarioId)
            .Select(e => e.DependenciaId)
            .FirstOrDefaultAsync(cancellationToken);

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

        var respuestas = request.Respuestas
            .GroupBy(e => e.PreguntaId)
            .Select(e => e.Last())
            .ToDictionary(e => e.PreguntaId, e => e.OpcionId);

        if (respuestas.Count != curso.Preguntas.Count)
        {
            throw new ArgumentException("Debe responder todas las preguntas de la evaluacion.");
        }

        var detalle = new List<ResultadoPreguntaFormacionResponse>();
        var correctas = 0;

        foreach (var pregunta in curso.Preguntas.OrderBy(e => e.Orden))
        {
            if (!respuestas.TryGetValue(pregunta.Id, out Guid opcionId))
            {
                throw new ArgumentException("Debe responder todas las preguntas de la evaluacion.");
            }

            var opcion = pregunta.Opciones.FirstOrDefault(e => e.Id == opcionId);

            if (opcion is null)
            {
                throw new ArgumentException("Una de las respuestas seleccionadas no pertenece a la pregunta.");
            }

            if (opcion.EsCorrecta)
            {
                correctas++;
            }

            detalle.Add(new ResultadoPreguntaFormacionResponse(
                pregunta.Id,
                pregunta.Texto,
                opcion.Id,
                opcion.Texto,
                opcion.EsCorrecta,
                pregunta.Explicacion));
        }

        var puntaje = (int)Math.Round(correctas * 100m / curso.Preguntas.Count, MidpointRounding.AwayFromZero);
        var aprobado = puntaje >= curso.PuntajeMinimo;
        var codigoCertificado = aprobado
            ? $"SIG-FOR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}"
            : null;

        var intento = new FormacionIntento(
            curso.Id,
            usuarioId,
            participanteNombre,
            participanteCorreo,
            curso.Preguntas.Count,
            correctas,
            puntaje,
            aprobado,
            codigoCertificado);

        foreach (var item in detalle)
        {
            intento.AgregarRespuesta(new FormacionRespuesta(
                intento.Id,
                item.PreguntaId,
                item.OpcionSeleccionadaId,
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
            curso.Preguntas.Count,
            correctas,
            aprobado,
            codigoCertificado,
            intento.FechaPresentacionUtc,
            detalle);
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

        return new CertificadoFormacionResponse(
            intento.Id,
            intento.CursoId,
            intento.Curso?.Titulo ?? "Capacitacion SIGETIC",
            intento.ParticipanteNombre,
            intento.ParticipanteCorreo,
            intento.Curso?.Categoria ?? "Formacion institucional",
            intento.Curso?.DirigidoA ?? "Funcionarios y contratistas",
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
            .ToDictionary(e => e.Key, e => ToIntentoResponse(e.First()));
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
                item.pregunta.Explicacion,
                item.index + 1);

            foreach (var opcion in item.pregunta.Opciones.Select((opcion, index) => new { opcion, index }))
            {
                pregunta.AgregarOpcion(new FormacionOpcion(
                    pregunta.Id,
                    opcion.opcion.Texto,
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

            if (pregunta.Opciones.Count < 2)
            {
                throw new ArgumentException("Cada pregunta debe tener al menos dos opciones.");
            }

            if (pregunta.Opciones.Count(e => e.EsCorrecta) != 1)
            {
                throw new ArgumentException("Cada pregunta debe tener exactamente una respuesta correcta.");
            }
        }
    }

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
                    e.Explicacion,
                    e.Orden,
                    e.Opciones
                        .OrderBy(option => option.Orden)
                        .Select(option => new OpcionFormacionResponse(
                            option.Id,
                            option.Texto,
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
