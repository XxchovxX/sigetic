using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SIGETIC.Application.Auth;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;
using SIGETIC.Infrastructure.Security;

namespace SIGETIC.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly SigeticDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly IConfiguration _configuration;

    public AuthService(
        SigeticDbContext dbContext,
        JwtTokenGenerator jwtTokenGenerator,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Correo))
        {
            throw new ArgumentException("El correo es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            throw new ArgumentException("La contraseña es obligatoria.");
        }

        string correo = request.Correo.Trim().ToLowerInvariant();

        var usuario = await _dbContext.Usuarios
            .Include(e => e.Rol)
            .Include(e => e.Dependencia)
            .FirstOrDefaultAsync(
                e => e.Correo == correo,
                cancellationToken);

        if (usuario is null)
        {
            throw new UnauthorizedAccessException(
                "Correo o contraseña incorrectos.");
        }

        if (!usuario.Activo)
        {
            throw new UnauthorizedAccessException(
                "El usuario se encuentra inactivo.");
        }

        if (usuario.Rol is null || !usuario.Rol.Activo)
        {
            throw new UnauthorizedAccessException(
                "El usuario no tiene un rol activo asignado.");
        }

        bool passwordIsValid = PasswordHasher.Verify(
            request.Password,
            usuario.PasswordHash);

        if (!passwordIsValid)
        {
            throw new UnauthorizedAccessException(
                "Correo o contraseña incorrectos.");
        }

        usuario.RegistrarAcceso();
        await _dbContext.SaveChangesAsync(cancellationToken);

        var permisos = await GetPermisosByRolAsync(
            usuario.RolId,
            cancellationToken);

        var authUser = BuildAuthUser(usuario, permisos);

        var token = _jwtTokenGenerator.GenerateToken(authUser);

        return new LoginResponse(
            token.Token,
            token.ExpiraEnUtc,
            authUser);
    }

    public GoogleAuthConfigResponse GetGoogleConfig()
    {
        var enabled = _configuration.GetValue<bool>("GoogleAuth:Enabled");
        var clientId = _configuration["GoogleAuth:ClientId"];

        return new GoogleAuthConfigResponse(
            enabled && !string.IsNullOrWhiteSpace(clientId),
            string.IsNullOrWhiteSpace(clientId) ? null : clientId);
    }

    public async Task<LoginResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var config = GetGoogleConfig();

        if (!config.Enabled || string.IsNullOrWhiteSpace(config.ClientId))
            throw new InvalidOperationException("El acceso con Google no está habilitado.");

        if (string.IsNullOrWhiteSpace(request.Credential))
            throw new ArgumentException("La credencial de Google es obligatoria.");

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                request.Credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [config.ClientId]
                });
        }
        catch (Exception exception) when (
            exception is InvalidJwtException or ArgumentException)
        {
            throw new UnauthorizedAccessException("La identidad de Google no es válida.");
        }

        if (!payload.EmailVerified || string.IsNullOrWhiteSpace(payload.Email))
            throw new UnauthorizedAccessException("Google no confirmó el correo electrónico.");

        var correo = payload.Email.Trim().ToLowerInvariant();
        var usuario = await _dbContext.Usuarios
            .Include(e => e.Rol)
            .Include(e => e.Dependencia)
            .FirstOrDefaultAsync(
                e => e.GoogleSubject == payload.Subject || e.Correo == correo,
                cancellationToken);

        if (usuario is null)
        {
            var rolFuncionario = await _dbContext.Roles
                .FirstOrDefaultAsync(
                    e => e.Nombre == "Funcionario" && e.Activo,
                    cancellationToken)
                ?? throw new InvalidOperationException("No existe el rol Funcionario activo.");

            usuario = new Usuario(
                string.IsNullOrWhiteSpace(payload.Name) ? correo : payload.Name,
                correo,
                PasswordHasher.Hash(Guid.NewGuid().ToString("N")),
                rolFuncionario.Id);
            usuario.EnlazarGoogle(payload.Subject);
            _dbContext.Usuarios.Add(usuario);
        }
        else if (!usuario.EsCuentaGoogle)
        {
            if (!string.Equals(usuario.Rol?.Nombre, "Funcionario", StringComparison.Ordinal))
                throw new UnauthorizedAccessException(
                    "Esta cuenta tiene acceso administrativo. Ingresa con correo y contraseña.");

            usuario.EnlazarGoogle(payload.Subject);
        }
        else if (!string.Equals(
            usuario.GoogleSubject,
            payload.Subject,
            StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("El correo ya está asociado a otra identidad de Google.");
        }

        if (usuario.Rol is null)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            await _dbContext.Entry(usuario).Reference(e => e.Rol).LoadAsync(cancellationToken);
        }

        ValidateActiveUser(usuario);
        usuario.RegistrarAcceso();
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await BuildLoginResponseAsync(usuario, cancellationToken);
    }

    public async Task<LoginResponse> CompletarPerfilAsync(
        Guid usuarioId,
        CompletarPerfilRequest request,
        CancellationToken cancellationToken)
    {
        var usuario = await _dbContext.Usuarios
            .Include(e => e.Rol)
            .Include(e => e.Dependencia)
            .FirstOrDefaultAsync(e => e.Id == usuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("No se encontró el usuario autenticado.");

        if (!usuario.EsCuentaGoogle)
            throw new InvalidOperationException("Este perfil no requiere completar registro con Google.");

        var dependenciaExiste = await _dbContext.Dependencias
            .AnyAsync(e => e.Id == request.DependenciaId && e.Activa, cancellationToken);

        if (!dependenciaExiste)
            throw new ArgumentException("Selecciona una dependencia activa.");

        usuario.CompletarPerfil(
            request.DependenciaId,
            request.Cargo,
            request.TipoVinculacion);

        await _dbContext.SaveChangesAsync(cancellationToken);
        await _dbContext.Entry(usuario).Reference(e => e.Dependencia).LoadAsync(cancellationToken);

        return await BuildLoginResponseAsync(usuario, cancellationToken);
    }

    public async Task<IReadOnlyList<PerfilDependenciaResponse>> GetDependenciasPerfilAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Dependencias
            .AsNoTracking()
            .Where(e => e.Activa)
            .OrderBy(e => e.Nombre)
            .Select(e => new PerfilDependenciaResponse(e.Id, e.Nombre, e.Codigo))
            .ToListAsync(cancellationToken);
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var usuario = await _dbContext.Usuarios
            .AsNoTracking()
            .Include(e => e.Rol)
            .Include(e => e.Dependencia)
            .FirstOrDefaultAsync(
                e => e.Id == usuarioId,
                cancellationToken);

        if (usuario is null)
        {
            throw new UnauthorizedAccessException(
                "No se encontró el usuario autenticado.");
        }

        if (!usuario.Activo)
        {
            throw new UnauthorizedAccessException(
                "El usuario se encuentra inactivo.");
        }

        if (usuario.Rol is null || !usuario.Rol.Activo)
        {
            throw new UnauthorizedAccessException(
                "El usuario no tiene un rol activo asignado.");
        }

        var permisos = await GetPermisosByRolAsync(
            usuario.RolId,
            cancellationToken);

        return BuildAuthUser(usuario, permisos);
    }

    public async Task<LoginResponse> RefreshAsync(
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var usuario = await _dbContext.Usuarios
            .Include(e => e.Rol)
            .Include(e => e.Dependencia)
            .FirstOrDefaultAsync(e => e.Id == usuarioId, cancellationToken)
            ?? throw new UnauthorizedAccessException("No se encontró el usuario autenticado.");

        ValidateActiveUser(usuario);
        return await BuildLoginResponseAsync(usuario, cancellationToken);
    }

    private async Task<LoginResponse> BuildLoginResponseAsync(
        Usuario usuario,
        CancellationToken cancellationToken)
    {
        var permisos = await GetPermisosByRolAsync(usuario.RolId, cancellationToken);
        var authUser = BuildAuthUser(usuario, permisos);
        var token = _jwtTokenGenerator.GenerateToken(authUser);

        return new LoginResponse(token.Token, token.ExpiraEnUtc, authUser);
    }

    private static AuthUserResponse BuildAuthUser(
        Usuario usuario,
        IReadOnlyList<string> permisos)
    {
        return new AuthUserResponse(
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.RolId,
            usuario.Rol?.Nombre ?? string.Empty,
            permisos,
            usuario.EsCuentaGoogle,
            usuario.PerfilCompleto,
            usuario.DependenciaId,
            usuario.Dependencia?.Nombre,
            usuario.Cargo,
            usuario.TipoVinculacion,
            usuario.PuedeGestionarFormacion,
            usuario.GestionFormacionHastaUtc);
    }

    private static void ValidateActiveUser(Usuario usuario)
    {
        if (!usuario.Activo)
            throw new UnauthorizedAccessException("El usuario se encuentra inactivo.");

        if (usuario.Rol is null || !usuario.Rol.Activo)
            throw new UnauthorizedAccessException("El usuario no tiene un rol activo asignado.");
    }

    private async Task<IReadOnlyList<string>> GetPermisosByRolAsync(
        Guid rolId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.RolesPermisos
            .AsNoTracking()
            .Include(e => e.Permiso)
            .Where(e => e.RolId == rolId && e.Permiso != null && e.Permiso.Activo)
            .Select(e => e.Permiso!.Codigo)
            .OrderBy(e => e)
            .ToListAsync(cancellationToken);
    }
}
