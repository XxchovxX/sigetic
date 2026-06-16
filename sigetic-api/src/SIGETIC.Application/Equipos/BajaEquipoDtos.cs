namespace SIGETIC.Application.Equipos;

public sealed record CrearBajaEquipoRequest(
    DateOnly FechaBaja,
    string MotivoBaja,
    string ResponsableBaja,
    string EstadoFisico,
    string DisposicionFinal,
    string? Observaciones
);

public sealed record BajaEquipoResponse(
    Guid Id,
    Guid EquipoId,
    DateOnly FechaBaja,
    string MotivoBaja,
    string ResponsableBaja,
    string EstadoFisico,
    string DisposicionFinal,
    string? Observaciones,
    DateTime FechaCreacionUtc
);