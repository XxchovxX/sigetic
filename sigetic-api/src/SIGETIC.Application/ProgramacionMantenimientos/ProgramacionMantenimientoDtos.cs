namespace SIGETIC.Application.ProgramacionMantenimientos;

public sealed record CrearProgramacionMantenimientoRequest(
    string TipoActivo,
    Guid? EquipoId,
    Guid? ImpresoraId,
    string TipoMantenimiento,
    string FechaProgramada,
    string? HoraProgramada,
    string Frecuencia,
    string TecnicoResponsable,
    string? CorreoTecnico,
    string? Observaciones
);

public sealed record ActualizarProgramacionMantenimientoRequest(
    string FechaProgramada,
    string? HoraProgramada,
    string Frecuencia,
    string TecnicoResponsable,
    string? CorreoTecnico,
    string? Observaciones
);

public sealed record EnviarRecordatoriosMantenimientoRequest(
    int DiasAnticipacion
);

public sealed record ProgramacionMantenimientoResponse(
    Guid Id,
    string TipoActivo,
    Guid? EquipoId,
    Guid? ImpresoraId,
    string CodigoActivo,
    string NombreActivo,
    string TipoMantenimiento,
    DateOnly FechaProgramada,
    TimeOnly? HoraProgramada,
    string Frecuencia,
    string Estado,
    string TecnicoResponsable,
    string? CorreoTecnico,
    string? Observaciones,
    DateTime? UltimaNotificacionUtc,
    DateTime FechaCreacionUtc,
    DateTime? FechaActualizacionUtc
);

public sealed record RecordatoriosMantenimientoResponse(
    int TotalNotificados,
    IReadOnlyList<ProgramacionMantenimientoResponse> Programaciones
);
