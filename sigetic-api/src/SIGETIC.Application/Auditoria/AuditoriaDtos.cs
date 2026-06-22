namespace SIGETIC.Application.Auditoria;

public sealed record AuditoriaRegistroResponse(
    Guid Id,
    string Modulo,
    string Accion,
    string Entidad,
    string? RegistroId,
    string Usuario,
    string? Rol,
    string? MetodoHttp,
    string? Ruta,
    string? DireccionIp,
    string? Resumen,
    DateTime FechaEventoUtc
);
