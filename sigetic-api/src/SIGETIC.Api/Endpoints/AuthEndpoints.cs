using System.Security.Claims;
using SIGETIC.Application.Auth;

namespace SIGETIC.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Autenticación");

        group.MapPost("/login", async (
            LoginRequest request,
            IAuthService authService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var response = await authService.LoginAsync(
                    request,
                    cancellationToken);

                return Results.Ok(response);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        group.MapGet("/me", async (
            ClaimsPrincipal user,
            IAuthService authService,
            CancellationToken cancellationToken) =>
        {
            string? usuarioIdValue = user.FindFirstValue("usuario_id");

            if (!Guid.TryParse(usuarioIdValue, out Guid usuarioId))
            {
                return Results.Unauthorized();
            }

            try
            {
                var currentUser = await authService.GetCurrentUserAsync(
                    usuarioId,
                    cancellationToken);

                return Results.Ok(currentUser);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        })
        .RequireAuthorization();

        return app;
    }
}
