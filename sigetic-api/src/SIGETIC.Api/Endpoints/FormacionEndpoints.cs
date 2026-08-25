using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SIGETIC.Application.Formacion;

namespace SIGETIC.Api.Endpoints;

public static class FormacionEndpoints
{
    public static IEndpointRouteBuilder MapFormacionEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/formacion")
            .WithTags("Formacion")
            .RequireAuthorization("Formacion");

        group.MapGet("/destinatarios", async (
            IFormacionService service,
            CancellationToken cancellationToken) =>
            Results.Ok(await service.GetDestinatariosAsync(cancellationToken)))
        .RequireAuthorization("FormacionGestion");

        group.MapGet("/cursos", async (
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            var cursos = await service.GetCursosAsync(
                GetUserId(user),
                CanManageTraining(user),
                cancellationToken);

            return Results.Ok(cursos);
        });

        group.MapGet("/cursos/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            var curso = await service.GetCursoByIdAsync(
                id,
                GetUserId(user),
                CanManageTraining(user),
                cancellationToken);

            return curso is null
                ? Results.NotFound(new { message = "No se encontro la capacitacion solicitada." })
                : Results.Ok(curso);
        });

        group.MapPost("/cursos", async (
            CrearCursoFormacionRequest request,
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var curso = await service.CreateCursoAsync(
                    request,
                    GetUserId(user),
                    cancellationToken);

                return Results.Created($"/api/formacion/cursos/{curso.Id}", curso);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        })
        .RequireAuthorization("FormacionGestion");

        group.MapPut("/cursos/{id:guid}", async (
            Guid id,
            ActualizarCursoFormacionRequest request,
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var curso = await service.UpdateCursoAsync(
                    id,
                    request,
                    GetUserId(user),
                    cancellationToken);

                return Results.Ok(curso);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
        })
        .RequireAuthorization("FormacionGestion");

        group.MapPost("/cursos/{id:guid}/evaluacion", async (
            Guid id,
            ResponderEvaluacionFormacionRequest request,
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var resultado = await service.ResponderEvaluacionAsync(
                    id,
                    request,
                    GetUserId(user),
                    GetName(user),
                    GetEmail(user),
                    cancellationToken);

                return Results.Ok(resultado);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
        });

        group.MapGet("/mis-intentos", async (
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            var intentos = await service.GetMisIntentosAsync(
                GetUserId(user),
                cancellationToken);

            return Results.Ok(intentos);
        });

        group.MapGet("/certificados/{intentoId:guid}", async (
            Guid intentoId,
            ClaimsPrincipal user,
            IFormacionService service,
            CancellationToken cancellationToken) =>
        {
            var certificado = await service.GetCertificadoAsync(
                intentoId,
                GetUserId(user),
                CanManageTraining(user),
                cancellationToken);

            return certificado is null
                ? Results.NotFound(new { message = "No se encontro un certificado aprobado para este intento." })
                : Results.Ok(certificado);
        });

        return app;
    }

    private static Guid GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("usuario_id") ??
            user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(value, out Guid id)
            ? id
            : throw new InvalidOperationException("No se pudo identificar el usuario autenticado.");
    }

    private static string GetName(ClaimsPrincipal user)
    {
        return user.FindFirstValue(ClaimTypes.Name) ??
            user.FindFirstValue(JwtRegisteredClaimNames.Email) ??
            user.FindFirstValue(ClaimTypes.Email) ??
            "Usuario SIGETIC";
    }

    private static string GetEmail(ClaimsPrincipal user)
    {
        return user.FindFirstValue(JwtRegisteredClaimNames.Email) ??
            user.FindFirstValue(ClaimTypes.Email) ??
            "sin-correo@sigetic.local";
    }

    private static bool CanManageTraining(ClaimsPrincipal user)
    {
        var role = user.FindFirstValue(ClaimTypes.Role);

        return role is
            "Administrador" or
            "Administrador TIC" or
            "Tecnico TIC" or
            "Auxiliar de Sistemas";
    }
}
