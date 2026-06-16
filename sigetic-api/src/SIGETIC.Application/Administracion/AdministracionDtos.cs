namespace SIGETIC.Application.Administracion;

public sealed record RolResponse(
    Guid Id,
    string Nombre,
    string Descripcion,
    bool EsSistema,
    bool Activo,
    DateTime FechaCreacionUtc
);

public sealed record CrearRolRequest(
    string Nombre,
    string Descripcion
);

public sealed record ActualizarRolRequest(
    string Nombre,
    string Descripcion,
    bool Activo
);

public sealed record PermisoResponse(
    Guid Id,
    string Codigo,
    string Modulo,
    string Accion,
    string Descripcion,
    bool Activo
);

public sealed record UsuarioResponse(
    Guid Id,
    string NombreCompleto,
    string Correo,
    Guid RolId,
    string Rol,
    bool Activo,
    DateTime FechaCreacionUtc,
    DateTime? UltimoAccesoUtc
);

public sealed record CrearUsuarioRequest(
    string NombreCompleto,
    string Correo,
    string Password,
    Guid RolId
);

public sealed record ActualizarUsuarioRequest(
    string NombreCompleto,
    string Correo,
    Guid RolId,
    bool Activo
);

public sealed record DependenciaResponse(
    Guid Id,
    string Nombre,
    string Codigo,
    string? Responsable,
    string? Correo,
    bool Activa,
    DateTime FechaCreacionUtc
);

public sealed record CrearDependenciaRequest(
    string Nombre,
    string Codigo,
    string? Responsable,
    string? Correo
);

public sealed record ActualizarDependenciaRequest(
    string Nombre,
    string Codigo,
    string? Responsable,
    string? Correo,
    bool Activa
);

public sealed record FuncionarioResponse(
    Guid Id,
    string NombreCompleto,
    string Documento,
    string Cargo,
    Guid DependenciaId,
    string Dependencia,
    string? Correo,
    string? Telefono,
    bool Activo,
    DateTime FechaCreacionUtc
);

public sealed record CrearFuncionarioRequest(
    string NombreCompleto,
    string Documento,
    string Cargo,
    Guid DependenciaId,
    string? Correo,
    string? Telefono
);

public sealed record ActualizarFuncionarioRequest(
    string NombreCompleto,
    string Documento,
    string Cargo,
    Guid DependenciaId,
    string? Correo,
    string? Telefono,
    bool Activo
);