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

        group.MapGet("/google/config", (IAuthService authService) =>
            Results.Ok(authService.GetGoogleConfig()));

        group.MapPost("/google", async (
            GoogleLoginRequest request,
            IAuthService authService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(await authService.LoginWithGoogleAsync(
                    request,
                    cancellationToken));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
            catch (UnauthorizedAccessException exception)
            {
                return Results.Json(
                    new { message = exception.Message },
                    statusCode: StatusCodes.Status401Unauthorized);
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

        group.MapPost("/refresh", async (
            ClaimsPrincipal user,
            IAuthService authService,
            CancellationToken cancellationToken) =>
        {
            if (!Guid.TryParse(user.FindFirstValue("usuario_id"), out Guid usuarioId))
                return Results.Unauthorized();

            try
            {
                return Results.Ok(await authService.RefreshAsync(usuarioId, cancellationToken));
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        })
        .RequireAuthorization();

        group.MapGet("/perfil/dependencias", async (
            IAuthService authService,
            CancellationToken cancellationToken) =>
            Results.Ok(await authService.GetDependenciasPerfilAsync(cancellationToken)))
        .RequireAuthorization();

        group.MapPut("/perfil", async (
            CompletarPerfilRequest request,
            ClaimsPrincipal user,
            IAuthService authService,
            CancellationToken cancellationToken) =>
        {
            if (!Guid.TryParse(user.FindFirstValue("usuario_id"), out Guid usuarioId))
                return Results.Unauthorized();

            try
            {
                return Results.Ok(await authService.CompletarPerfilAsync(
                    usuarioId,
                    request,
                    cancellationToken));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
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
