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
    IReadOnlyList<string> Permisos,
    bool EsCuentaGoogle,
    bool PerfilCompleto,
    Guid? DependenciaId,
    string? Dependencia,
    string? Cargo,
    string? TipoVinculacion
);

public sealed record GoogleLoginRequest(string Credential);

public sealed record GoogleAuthConfigResponse(bool Enabled, string? ClientId);

public sealed record CompletarPerfilRequest(
    Guid DependenciaId,
    string Cargo,
    string TipoVinculacion
);

public sealed record PerfilDependenciaResponse(Guid Id, string Nombre, string Codigo);

public sealed record LoginResponse(
    string Token,
    DateTime ExpiraEnUtc,
    AuthUserResponse Usuario
);
