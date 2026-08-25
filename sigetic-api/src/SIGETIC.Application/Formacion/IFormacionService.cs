namespace SIGETIC.Application.Formacion;

public interface IFormacionService
{
    Task<IReadOnlyList<CursoFormacionResponse>> GetCursosAsync(
        Guid usuarioId,
        bool incluirInactivos,
        CancellationToken cancellationToken);

    Task<CursoFormacionResponse?> GetCursoByIdAsync(
        Guid id,
        Guid usuarioId,
        bool incluirInactivos,
        CancellationToken cancellationToken);

    Task<CursoFormacionResponse> CreateCursoAsync(
        CrearCursoFormacionRequest request,
        Guid usuarioId,
        CancellationToken cancellationToken);

    Task<CursoFormacionResponse> UpdateCursoAsync(
        Guid id,
        ActualizarCursoFormacionRequest request,
        Guid usuarioId,
        CancellationToken cancellationToken);

    Task<ResultadoEvaluacionFormacionResponse> ResponderEvaluacionAsync(
        Guid cursoId,
        ResponderEvaluacionFormacionRequest request,
        Guid usuarioId,
        string participanteNombre,
        string participanteCorreo,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<IntentoFormacionResumenResponse>> GetMisIntentosAsync(
        Guid usuarioId,
        CancellationToken cancellationToken);

    Task<CertificadoFormacionResponse?> GetCertificadoAsync(
        Guid intentoId,
        Guid usuarioId,
        bool puedeVerTodos,
        CancellationToken cancellationToken);
}
