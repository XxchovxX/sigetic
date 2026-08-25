namespace SIGETIC.Application.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken);

    GoogleAuthConfigResponse GetGoogleConfig();

    Task<LoginResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        CancellationToken cancellationToken);

    Task<LoginResponse> CompletarPerfilAsync(
        Guid usuarioId,
        CompletarPerfilRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<PerfilDependenciaResponse>> GetDependenciasPerfilAsync(
        CancellationToken cancellationToken);

    Task<AuthUserResponse> GetCurrentUserAsync(
        Guid usuarioId,
        CancellationToken cancellationToken);
}
