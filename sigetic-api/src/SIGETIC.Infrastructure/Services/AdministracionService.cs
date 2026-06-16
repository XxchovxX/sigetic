using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Administracion;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;
using SIGETIC.Infrastructure.Security;

namespace SIGETIC.Infrastructure.Services;

public sealed class AdministracionService : IAdministracionService
{
    private readonly SigeticDbContext _dbContext;

    public AdministracionService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<RolResponse>> GetRolesAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Roles
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .Select(e => new RolResponse(
                e.Id,
                e.Nombre,
                e.Descripcion,
                e.EsSistema,
                e.Activo,
                e.FechaCreacionUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<RolResponse> CreateRolAsync(
        CrearRolRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ArgumentException("El nombre del rol es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Descripcion))
            throw new ArgumentException("La descripción del rol es obligatoria.");

        bool exists = await _dbContext.Roles
            .AnyAsync(e => e.Nombre == request.Nombre.Trim(), cancellationToken);

        if (exists)
            throw new InvalidOperationException("Ya existe un rol con ese nombre.");

        var rol = new Rol(request.Nombre, request.Descripcion);

        _dbContext.Roles.Add(rol);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RolResponse(
            rol.Id,
            rol.Nombre,
            rol.Descripcion,
            rol.EsSistema,
            rol.Activo,
            rol.FechaCreacionUtc);
    }

    public async Task<RolResponse> UpdateRolAsync(
        Guid id,
        ActualizarRolRequest request,
        CancellationToken cancellationToken)
    {
        var rol = await _dbContext.Roles
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (rol is null)
            throw new KeyNotFoundException("No se encontró el rol solicitado.");

        bool exists = await _dbContext.Roles
            .AnyAsync(
                e => e.Id != id && e.Nombre == request.Nombre.Trim(),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException("Ya existe otro rol con ese nombre.");

        rol.Actualizar(request.Nombre, request.Descripcion, request.Activo);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new RolResponse(
            rol.Id,
            rol.Nombre,
            rol.Descripcion,
            rol.EsSistema,
            rol.Activo,
            rol.FechaCreacionUtc);
    }

    public async Task<IReadOnlyList<PermisoResponse>> GetPermisosAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Permisos
            .AsNoTracking()
            .OrderBy(e => e.Modulo)
            .ThenBy(e => e.Accion)
            .Select(e => new PermisoResponse(
                e.Id,
                e.Codigo,
                e.Modulo,
                e.Accion,
                e.Descripcion,
                e.Activo))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<UsuarioResponse>> GetUsuariosAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Usuarios
            .AsNoTracking()
            .Include(e => e.Rol)
            .OrderBy(e => e.NombreCompleto)
            .Select(e => new UsuarioResponse(
                e.Id,
                e.NombreCompleto,
                e.Correo,
                e.RolId,
                e.Rol != null ? e.Rol.Nombre : "Sin rol",
                e.Activo,
                e.FechaCreacionUtc,
                e.UltimoAccesoUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<UsuarioResponse> CreateUsuarioAsync(
        CrearUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        ValidateUsuario(
            request.NombreCompleto,
            request.Correo,
            request.RolId);

        if (string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 8)
        {
            throw new ArgumentException(
                "La contraseña debe tener mínimo 8 caracteres.");
        }

        bool exists = await _dbContext.Usuarios
            .AnyAsync(
                e => e.Correo == request.Correo.Trim().ToLower(),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException("Ya existe un usuario con ese correo.");

        var rol = await _dbContext.Roles
            .FirstOrDefaultAsync(
                e => e.Id == request.RolId && e.Activo,
                cancellationToken);

        if (rol is null)
            throw new InvalidOperationException("El rol seleccionado no existe o está inactivo.");

        var usuario = new Usuario(
            request.NombreCompleto,
            request.Correo,
            PasswordHasher.Hash(request.Password),
            request.RolId);

        _dbContext.Usuarios.Add(usuario);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UsuarioResponse(
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.RolId,
            rol.Nombre,
            usuario.Activo,
            usuario.FechaCreacionUtc,
            usuario.UltimoAccesoUtc);
    }

    public async Task<UsuarioResponse> UpdateUsuarioAsync(
        Guid id,
        ActualizarUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        ValidateUsuario(
            request.NombreCompleto,
            request.Correo,
            request.RolId);

        var usuario = await _dbContext.Usuarios
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (usuario is null)
            throw new KeyNotFoundException("No se encontró el usuario solicitado.");

        bool exists = await _dbContext.Usuarios
            .AnyAsync(
                e => e.Id != id &&
                     e.Correo == request.Correo.Trim().ToLower(),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException("Ya existe otro usuario con ese correo.");

        var rol = await _dbContext.Roles
            .FirstOrDefaultAsync(e => e.Id == request.RolId, cancellationToken);

        if (rol is null)
            throw new InvalidOperationException("El rol seleccionado no existe.");

        usuario.Actualizar(
            request.NombreCompleto,
            request.Correo,
            request.RolId,
            request.Activo);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UsuarioResponse(
            usuario.Id,
            usuario.NombreCompleto,
            usuario.Correo,
            usuario.RolId,
            rol.Nombre,
            usuario.Activo,
            usuario.FechaCreacionUtc,
            usuario.UltimoAccesoUtc);
    }

    public async Task CambiarPasswordUsuarioAsync(
        Guid id,
        CambiarPasswordUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NuevoPassword) ||
            request.NuevoPassword.Length < 8)
        {
            throw new ArgumentException(
                "La nueva contraseña debe tener mínimo 8 caracteres.");
        }

        var usuario = await _dbContext.Usuarios
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (usuario is null)
            throw new KeyNotFoundException("No se encontró el usuario solicitado.");

        usuario.CambiarPassword(PasswordHasher.Hash(request.NuevoPassword));

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteUsuarioAsync(
        Guid id,
        Guid currentUserId,
        CancellationToken cancellationToken)
    {
        if (id == currentUserId)
        {
            throw new InvalidOperationException(
                "No puedes eliminar tu propio usuario mientras tienes la sesión abierta.");
        }

        var usuario = await _dbContext.Usuarios
            .Include(e => e.Rol)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (usuario is null)
            throw new KeyNotFoundException("No se encontró el usuario solicitado.");

        if (usuario.Rol?.Nombre == "Administrador" && usuario.Activo)
        {
            int activeAdmins = await _dbContext.Usuarios
                .Include(e => e.Rol)
                .CountAsync(
                    e => e.Activo && e.Rol != null && e.Rol.Nombre == "Administrador",
                    cancellationToken);

            if (activeAdmins <= 1)
            {
                throw new InvalidOperationException(
                    "No puedes eliminar el último administrador activo del sistema.");
            }
        }

        _dbContext.Usuarios.Remove(usuario);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<DependenciaResponse>> GetDependenciasAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Dependencias
            .AsNoTracking()
            .OrderBy(e => e.Nombre)
            .Select(e => new DependenciaResponse(
                e.Id,
                e.Nombre,
                e.Codigo,
                e.Responsable,
                e.Correo,
                e.Activa,
                e.FechaCreacionUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<DependenciaResponse> CreateDependenciaAsync(
        CrearDependenciaRequest request,
        CancellationToken cancellationToken)
    {
        ValidateDependencia(request.Nombre, request.Codigo);

        bool exists = await _dbContext.Dependencias
            .AnyAsync(
                e => e.Nombre == request.Nombre.Trim() ||
                     e.Codigo == request.Codigo.Trim().ToUpper(),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException(
                "Ya existe una dependencia con ese nombre o código.");

        var dependencia = new Dependencia(
            request.Nombre,
            request.Codigo,
            request.Responsable,
            request.Correo);

        _dbContext.Dependencias.Add(dependencia);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDependenciaResponse(dependencia);
    }

    public async Task<DependenciaResponse> UpdateDependenciaAsync(
        Guid id,
        ActualizarDependenciaRequest request,
        CancellationToken cancellationToken)
    {
        ValidateDependencia(request.Nombre, request.Codigo);

        var dependencia = await _dbContext.Dependencias
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (dependencia is null)
            throw new KeyNotFoundException("No se encontró la dependencia solicitada.");

        bool exists = await _dbContext.Dependencias
            .AnyAsync(
                e => e.Id != id &&
                     (e.Nombre == request.Nombre.Trim() ||
                      e.Codigo == request.Codigo.Trim().ToUpper()),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException(
                "Ya existe otra dependencia con ese nombre o código.");

        dependencia.Actualizar(
            request.Nombre,
            request.Codigo,
            request.Responsable,
            request.Correo,
            request.Activa);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToDependenciaResponse(dependencia);
    }

    public async Task<IReadOnlyList<FuncionarioResponse>> GetFuncionariosAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Funcionarios
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .OrderBy(e => e.NombreCompleto)
            .Select(e => new FuncionarioResponse(
                e.Id,
                e.NombreCompleto,
                e.Documento,
                e.Cargo,
                e.DependenciaId,
                e.Dependencia != null ? e.Dependencia.Nombre : "Sin dependencia",
                e.Correo,
                e.Telefono,
                e.Activo,
                e.FechaCreacionUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<FuncionarioResponse> CreateFuncionarioAsync(
        CrearFuncionarioRequest request,
        CancellationToken cancellationToken)
    {
        ValidateFuncionario(
            request.NombreCompleto,
            request.Documento,
            request.Cargo,
            request.DependenciaId);

        bool exists = await _dbContext.Funcionarios
            .AnyAsync(e => e.Documento == request.Documento.Trim(), cancellationToken);

        if (exists)
            throw new InvalidOperationException(
                "Ya existe un funcionario con ese documento.");

        var dependencia = await _dbContext.Dependencias
            .FirstOrDefaultAsync(
                e => e.Id == request.DependenciaId && e.Activa,
                cancellationToken);

        if (dependencia is null)
            throw new InvalidOperationException(
                "La dependencia seleccionada no existe o está inactiva.");

        var funcionario = new Funcionario(
            request.NombreCompleto,
            request.Documento,
            request.Cargo,
            request.DependenciaId,
            request.Correo,
            request.Telefono);

        _dbContext.Funcionarios.Add(funcionario);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToFuncionarioResponse(funcionario, dependencia.Nombre);
    }

    public async Task<FuncionarioResponse> UpdateFuncionarioAsync(
        Guid id,
        ActualizarFuncionarioRequest request,
        CancellationToken cancellationToken)
    {
        ValidateFuncionario(
            request.NombreCompleto,
            request.Documento,
            request.Cargo,
            request.DependenciaId);

        var funcionario = await _dbContext.Funcionarios
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (funcionario is null)
            throw new KeyNotFoundException("No se encontró el funcionario solicitado.");

        bool exists = await _dbContext.Funcionarios
            .AnyAsync(
                e => e.Id != id && e.Documento == request.Documento.Trim(),
                cancellationToken);

        if (exists)
            throw new InvalidOperationException(
                "Ya existe otro funcionario con ese documento.");

        var dependencia = await _dbContext.Dependencias
            .FirstOrDefaultAsync(e => e.Id == request.DependenciaId, cancellationToken);

        if (dependencia is null)
            throw new InvalidOperationException("La dependencia seleccionada no existe.");

        funcionario.Actualizar(
            request.NombreCompleto,
            request.Documento,
            request.Cargo,
            request.DependenciaId,
            request.Correo,
            request.Telefono,
            request.Activo);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToFuncionarioResponse(funcionario, dependencia.Nombre);
    }

    private static void ValidateUsuario(
        string nombreCompleto,
        string correo,
        Guid rolId)
    {
        if (string.IsNullOrWhiteSpace(nombreCompleto))
            throw new ArgumentException("El nombre completo es obligatorio.");

        if (string.IsNullOrWhiteSpace(correo))
            throw new ArgumentException("El correo es obligatorio.");

        if (!correo.Contains('@'))
            throw new ArgumentException("El correo no tiene un formato válido.");

        if (rolId == Guid.Empty)
            throw new ArgumentException("El rol es obligatorio.");
    }

    private static void ValidateDependencia(string nombre, string codigo)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre de la dependencia es obligatorio.");

        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código de la dependencia es obligatorio.");
    }

    private static void ValidateFuncionario(
        string nombreCompleto,
        string documento,
        string cargo,
        Guid dependenciaId)
    {
        if (string.IsNullOrWhiteSpace(nombreCompleto))
            throw new ArgumentException("El nombre completo es obligatorio.");

        if (string.IsNullOrWhiteSpace(documento))
            throw new ArgumentException("El documento es obligatorio.");

        if (string.IsNullOrWhiteSpace(cargo))
            throw new ArgumentException("El cargo es obligatorio.");

        if (dependenciaId == Guid.Empty)
            throw new ArgumentException("La dependencia es obligatoria.");
    }

    private static DependenciaResponse ToDependenciaResponse(
        Dependencia dependencia)
    {
        return new DependenciaResponse(
            dependencia.Id,
            dependencia.Nombre,
            dependencia.Codigo,
            dependencia.Responsable,
            dependencia.Correo,
            dependencia.Activa,
            dependencia.FechaCreacionUtc);
    }

    private static FuncionarioResponse ToFuncionarioResponse(
        Funcionario funcionario,
        string dependencia)
    {
        return new FuncionarioResponse(
            funcionario.Id,
            funcionario.NombreCompleto,
            funcionario.Documento,
            funcionario.Cargo,
            funcionario.DependenciaId,
            dependencia,
            funcionario.Correo,
            funcionario.Telefono,
            funcionario.Activo,
            funcionario.FechaCreacionUtc);
    }
}
