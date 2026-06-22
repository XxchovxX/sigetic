namespace SIGETIC.Application.Auditoria;

public interface IAuditoriaService
{
    Task<IReadOnlyList<AuditoriaRegistroResponse>> GetAsync(
        string? modulo,
        string? accion,
        string? usuario,
        DateTime? desdeUtc,
        DateTime? hastaUtc,
        int take,
        CancellationToken cancellationToken);
}
