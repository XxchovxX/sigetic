namespace SIGETIC.Application.Auth;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(
        LoginRequest request,
        CancellationToken cancellationToken);

    Task<AuthUserResponse> GetCurrentUserAsync(
        Guid usuarioId,
        CancellationToken cancellationToken);
}