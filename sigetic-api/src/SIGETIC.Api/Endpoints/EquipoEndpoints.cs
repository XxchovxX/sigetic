using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SIGETIC.Application.Equipos;

namespace SIGETIC.Api.Endpoints;

public static class EquipoEndpoints
{
    public static IEndpointRouteBuilder MapEquipoEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/equipos")
            .WithTags("Equipos")
            .RequireAuthorization("TecnicoLectura");

        group.MapGet("/", async (
            IEquipoService equipoService,
            CancellationToken cancellationToken) =>
        {
            var equipos = await equipoService.GetAllAsync(cancellationToken);

            return Results.Ok(equipos);
        });

        group.MapGet("/codigo-sugerido", async (
            string tipoEquipo,
            string dependencia,
            IEquipoService equipoService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                return Results.Ok(await equipoService.GetCodigoSugeridoAsync(
                    tipoEquipo,
                    dependencia,
                    cancellationToken));
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IEquipoService equipoService,
            CancellationToken cancellationToken) =>
        {
            var equipo = await equipoService.GetByIdAsync(id, cancellationToken);

            if (equipo is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontró el equipo solicitado."
                });
            }

            return Results.Ok(equipo);
        });

        group.MapPost("/", async (
            CrearEquipoRequest request,
            IEquipoService equipoService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var equipo = await equipoService.CreateAsync(
                    request,
                    cancellationToken);

                return Results.Created($"/api/equipos/{equipo.Id}", equipo);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPost("/detecciones", async (
            ClaimsPrincipal user,
            IInventarioDeteccionService deteccionService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var deteccion = await deteccionService.CreateAsync(
                    GetUserId(user),
                    cancellationToken);

                return Results.Created(
                    $"/api/equipos/detecciones/{deteccion.Id}",
                    deteccion);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapGet("/detecciones/{id:guid}", async (
            Guid id,
            ClaimsPrincipal user,
            IInventarioDeteccionService deteccionService,
            CancellationToken cancellationToken) =>
        {
            var deteccion = await deteccionService.GetStatusAsync(
                id,
                GetUserId(user),
                cancellationToken);

            return deteccion is null
                ? Results.NotFound(new { message = "No se encontro la deteccion solicitada." })
                : Results.Ok(deteccion);
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPost("/detecciones/reportar", async (
            ReportarInventarioDeteccionRequest request,
            HttpContext httpContext,
            IInventarioDeteccionService deteccionService,
            CancellationToken cancellationToken) =>
        {
            var token = httpContext.Request.Headers["X-SIGETIC-Collector-Token"].ToString();

            try
            {
                await deteccionService.ReceiveAsync(
                    token,
                    request,
                    httpContext.Connection.RemoteIpAddress?.ToString(),
                    cancellationToken);

                return Results.Ok(new
                {
                    message = "Inventario tecnico recibido correctamente. Regresa a SIGETIC para revisar los datos."
                });
            }
            catch (UnauthorizedAccessException exception)
            {
                return Results.Json(
                    new { message = exception.Message },
                    statusCode: StatusCodes.Status401Unauthorized);
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        })
        .AllowAnonymous();

        group.MapPut("/{id:guid}", async (
            Guid id,
            ActualizarEquipoRequest request,
            IEquipoService equipoService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var equipo = await equipoService.UpdateAsync(
                    id,
                    request,
                    cancellationToken);

                return Results.Ok(equipo);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapGet("/{equipoId:guid}/mantenimientos", async (
            Guid equipoId,
            IMantenimientoEquipoService mantenimientoService,
            CancellationToken cancellationToken) =>
        {
            var mantenimientos = await mantenimientoService.GetByEquipoIdAsync(
                equipoId,
                cancellationToken);

            return Results.Ok(mantenimientos);
        });

        group.MapPost("/{equipoId:guid}/mantenimientos", async (
            Guid equipoId,
            CrearMantenimientoEquipoRequest request,
            IMantenimientoEquipoService mantenimientoService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var mantenimiento = await mantenimientoService.CreateAsync(
                    equipoId,
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/equipos/{equipoId}/mantenimientos/{mantenimiento.Id}",
                    mantenimiento);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapGet("/{equipoId:guid}/baja", async (
            Guid equipoId,
            IBajaEquipoService bajaEquipoService,
            CancellationToken cancellationToken) =>
        {
            var baja = await bajaEquipoService.GetByEquipoIdAsync(
                equipoId,
                cancellationToken);

            if (baja is null)
            {
                return Results.NotFound(new
                {
                    message = "El equipo no tiene baja registrada."
                });
            }

            return Results.Ok(baja);
        });

        group.MapPost("/{equipoId:guid}/baja", async (
            Guid equipoId,
            CrearBajaEquipoRequest request,
            IBajaEquipoService bajaEquipoService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var baja = await bajaEquipoService.CreateAsync(
                    equipoId,
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/equipos/{equipoId}/baja",
                    baja);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        return app;
    }

    private static Guid GetUserId(ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("usuario_id") ??
            user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return Guid.TryParse(value, out var id)
            ? id
            : throw new InvalidOperationException("No se pudo identificar el usuario autenticado.");
    }
}
