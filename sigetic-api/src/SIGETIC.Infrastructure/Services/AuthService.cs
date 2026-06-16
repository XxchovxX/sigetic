using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Auth;
using SIGETIC.Infrastructure.Persistence;
using SIGETIC.Infrastructure.Security;

namespace SIGETIC.Infrastructure.Services;

public sealed class AuthService : IAuthService
{
    private readonly SigeticDbContext _dbContext;
    private readonly JwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        SigeticDbContext dbContext,
        JwtTokenGenerator jwtTokenGenerator)
    {
        _dbContext = dbContext;
        _jwtTokenGenerator = jwtTokenGenerator;
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

        var authUser = new AuthUserResponse(
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.RolId,
            usuario.Rol.Nombre,
            permisos);

        var token = _jwtTokenGenerator.GenerateToken(authUser);

        return new LoginResponse(
            token.Token,
            token.ExpiraEnUtc,
            authUser);
    }

    public async Task<AuthUserResponse> GetCurrentUserAsync(
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var usuario = await _dbContext.Usuarios
            .AsNoTracking()
            .Include(e => e.Rol)
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

        return new AuthUserResponse(
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.RolId,
            usuario.Rol.Nombre,
            permisos);
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