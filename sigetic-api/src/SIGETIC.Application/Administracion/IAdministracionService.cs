namespace SIGETIC.Application.Administracion;

public interface IAdministracionService
{
    Task<IReadOnlyList<RolResponse>> GetRolesAsync(
        CancellationToken cancellationToken);

    Task<RolResponse> CreateRolAsync(
        CrearRolRequest request,
        CancellationToken cancellationToken);

    Task<RolResponse> UpdateRolAsync(
        Guid id,
        ActualizarRolRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PermisoResponse>> GetPermisosAsync(
        CancellationToken cancellationToken);

    Task<IReadOnlyList<UsuarioResponse>> GetUsuariosAsync(
        CancellationToken cancellationToken);

    Task<UsuarioResponse> CreateUsuarioAsync(
        CrearUsuarioRequest request,
        CancellationToken cancellationToken);

    Task<UsuarioResponse> UpdateUsuarioAsync(
        Guid id,
        ActualizarUsuarioRequest request,
        CancellationToken cancellationToken);

    Task CambiarPasswordUsuarioAsync(
        Guid id,
        CambiarPasswordUsuarioRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<DependenciaResponse>> GetDependenciasAsync(
        CancellationToken cancellationToken);

    Task<DependenciaResponse> CreateDependenciaAsync(
        CrearDependenciaRequest request,
        CancellationToken cancellationToken);

    Task<DependenciaResponse> UpdateDependenciaAsync(
        Guid id,
        ActualizarDependenciaRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<FuncionarioResponse>> GetFuncionariosAsync(
        CancellationToken cancellationToken);

    Task<FuncionarioResponse> CreateFuncionarioAsync(
        CrearFuncionarioRequest request,
        CancellationToken cancellationToken);

    Task<FuncionarioResponse> UpdateFuncionarioAsync(
        Guid id,
        ActualizarFuncionarioRequest request,
        CancellationToken cancellationToken);
}
