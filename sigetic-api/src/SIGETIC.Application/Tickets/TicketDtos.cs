namespace SIGETIC.Application.Tickets;

public sealed record CrearTicketRequest(
    DateOnly FechaSolicitud,
    string Solicitante,
    string Dependencia,
    string Categoria,
    string Prioridad,
    string Estado,
    string Descripcion,
    string? ResponsableAsignado,
    string? EquipoCodigo,
    string? ImpresoraCodigo,
    DateOnly? FechaCompromiso,
    string? Solucion
);

public sealed record ActualizarEstadoTicketRequest(
    string Estado,
    string? ResponsableAsignado,
    string? Solucion
);

public sealed record RegistrarEncuestaTicketRequest(
    int CalificacionTiempo,
    int CalificacionAtencion,
    int CalificacionAmabilidad,
    int CalificacionSolucion,
    string? ComentarioSatisfaccion
);

public sealed record TicketResponse(
    Guid Id,
    string Codigo,
    DateOnly FechaSolicitud,
    string Solicitante,
    string Dependencia,
    string Categoria,
    string Prioridad,
    string Estado,
    string Descripcion,
    string? ResponsableAsignado,
    string? EquipoCodigo,
    string? ImpresoraCodigo,
    DateOnly? FechaCompromiso,
    string? Solucion,
    int? CalificacionTiempo,
    int? CalificacionAtencion,
    int? CalificacionAmabilidad,
    int? CalificacionSolucion,
    string? ComentarioSatisfaccion,
    DateTime? FechaEncuestaUtc,
    DateTime FechaCreacionUtc,
    DateTime? FechaActualizacionUtc
);
