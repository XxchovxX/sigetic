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
}
