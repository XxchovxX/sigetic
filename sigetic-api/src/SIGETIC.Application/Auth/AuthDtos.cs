namespace SIGETIC.Application.Auth;

public sealed record LoginRequest(
    string Correo,
    string Password
);

public sealed record AuthUserResponse(
    Guid Id,
    string NombreCompleto,
    string Correo,
    Guid RolId,
    string Rol,
    IReadOnlyList<string> Permisos
);

public sealed record LoginResponse(
    string Token,
    DateTime ExpiraEnUtc,
    AuthUserResponse Usuario
);