namespace SIGETIC.Application.ProgramacionMantenimientos;

public interface IProgramacionMantenimientoService
{
    Task<IReadOnlyList<ProgramacionMantenimientoResponse>> GetAllAsync(
        string? desde,
        string? hasta,
        string? estado,
        string? tipoActivo,
        CancellationToken cancellationToken);

    Task<ProgramacionMantenimientoResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<ProgramacionMantenimientoResponse> CreateAsync(
        CrearProgramacionMantenimientoRequest request,
        CancellationToken cancellationToken);

    Task<ProgramacionMantenimientoResponse> UpdateAsync(
        Guid id,
        ActualizarProgramacionMantenimientoRequest request,
        CancellationToken cancellationToken);

    Task<ProgramacionMantenimientoResponse> MarcarEjecutadoAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task CancelarAsync(
        Guid id,
        CancellationToken cancellationToken);

    Task<RecordatoriosMantenimientoResponse> EnviarRecordatoriosAsync(
        EnviarRecordatoriosMantenimientoRequest request,
        CancellationToken cancellationToken);
}
