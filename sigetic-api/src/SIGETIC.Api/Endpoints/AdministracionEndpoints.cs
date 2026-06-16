using SIGETIC.Application.Administracion;

namespace SIGETIC.Api.Endpoints;

public static class AdministracionEndpoints
{
    public static IEndpointRouteBuilder MapAdministracionEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/administracion")
            .WithTags("Administracion")
            .RequireAuthorization("Administracion");

        group.MapGet("/roles", async (
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            var roles = await service.GetRolesAsync(cancellationToken);
            return Results.Ok(roles);
        });

        group.MapPost("/roles", async (
            CrearRolRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var rol = await service.CreateRolAsync(request, cancellationToken);
                return Results.Created($"/api/administracion/roles/{rol.Id}", rol);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapPut("/roles/{id:guid}", async (
            Guid id,
            ActualizarRolRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var rol = await service.UpdateRolAsync(id, request, cancellationToken);
                return Results.Ok(rol);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapGet("/permisos", async (
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            var permisos = await service.GetPermisosAsync(cancellationToken);
            return Results.Ok(permisos);
        });

        group.MapGet("/usuarios", async (
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            var usuarios = await service.GetUsuariosAsync(cancellationToken);
            return Results.Ok(usuarios);
        });

        group.MapPost("/usuarios", async (
            CrearUsuarioRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var usuario = await service.CreateUsuarioAsync(request, cancellationToken);
                return Results.Created($"/api/administracion/usuarios/{usuario.Id}", usuario);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapPut("/usuarios/{id:guid}", async (
            Guid id,
            ActualizarUsuarioRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var usuario = await service.UpdateUsuarioAsync(id, request, cancellationToken);
                return Results.Ok(usuario);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapPatch("/usuarios/{id:guid}/password", async (
            Guid id,
            CambiarPasswordUsuarioRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await service.CambiarPasswordUsuarioAsync(
                    id,
                    request,
                    cancellationToken);

                return Results.NoContent();
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
        });

        group.MapDelete("/usuarios/{id:guid}", async (
            Guid id,
            HttpContext httpContext,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                string? userIdValue = httpContext.User.FindFirst("usuario_id")?.Value;

                if (!Guid.TryParse(userIdValue, out Guid currentUserId))
                {
                    return Results.Unauthorized();
                }

                await service.DeleteUsuarioAsync(
                    id,
                    currentUserId,
                    cancellationToken);

                return Results.NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapGet("/dependencias", async (
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            var dependencias = await service.GetDependenciasAsync(cancellationToken);
            return Results.Ok(dependencias);
        });

        group.MapPost("/dependencias", async (
            CrearDependenciaRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var dependencia = await service.CreateDependenciaAsync(
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/administracion/dependencias/{dependencia.Id}",
                    dependencia);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapPut("/dependencias/{id:guid}", async (
            Guid id,
            ActualizarDependenciaRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var dependencia = await service.UpdateDependenciaAsync(
                    id,
                    request,
                    cancellationToken);

                return Results.Ok(dependencia);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapGet("/funcionarios", async (
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            var funcionarios = await service.GetFuncionariosAsync(cancellationToken);
            return Results.Ok(funcionarios);
        });

        group.MapPost("/funcionarios", async (
            CrearFuncionarioRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var funcionario = await service.CreateFuncionarioAsync(
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/administracion/funcionarios/{funcionario.Id}",
                    funcionario);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        group.MapPut("/funcionarios/{id:guid}", async (
            Guid id,
            ActualizarFuncionarioRequest request,
            IAdministracionService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var funcionario = await service.UpdateFuncionarioAsync(
                    id,
                    request,
                    cancellationToken);

                return Results.Ok(funcionario);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        });

        return app;
    }
}
