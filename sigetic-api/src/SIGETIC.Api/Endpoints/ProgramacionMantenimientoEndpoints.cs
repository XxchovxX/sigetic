using SIGETIC.Application.ProgramacionMantenimientos;

namespace SIGETIC.Api.Endpoints;

public static class ProgramacionMantenimientoEndpoints
{
    public static IEndpointRouteBuilder MapProgramacionMantenimientoEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/programacion-mantenimientos")
            .WithTags("Programacion de mantenimientos")
            .RequireAuthorization("TecnicoLectura");

        group.MapGet("/", async (
            string? desde,
            string? hasta,
            string? estado,
            string? tipoActivo,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var programaciones = await service.GetAllAsync(
                    desde,
                    hasta,
                    estado,
                    tipoActivo,
                    cancellationToken);

                return Results.Ok(programaciones);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new
                {
                    message = exception.Message
                });
            }
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            var programacion = await service.GetByIdAsync(id, cancellationToken);

            if (programacion is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontro la programacion solicitada."
                });
            }

            return Results.Ok(programacion);
        });

        group.MapPost("/", async (
            CrearProgramacionMantenimientoRequest request,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var programacion = await service.CreateAsync(
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/programacion-mantenimientos/{programacion.Id}",
                    programacion);
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
            ActualizarProgramacionMantenimientoRequest request,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var programacion = await service.UpdateAsync(
                    id,
                    request,
                    cancellationToken);

                return Results.Ok(programacion);
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
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPost("/{id:guid}/ejecutar", async (
            Guid id,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var programacion = await service.MarcarEjecutadoAsync(
                    id,
                    cancellationToken);

                return Results.Ok(programacion);
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPost("/{id:guid}/cancelar", async (
            Guid id,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await service.CancelarAsync(id, cancellationToken);

                return Results.NoContent();
            }
            catch (KeyNotFoundException exception)
            {
                return Results.NotFound(new
                {
                    message = exception.Message
                });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPost("/recordatorios", async (
            EnviarRecordatoriosMantenimientoRequest request,
            IProgramacionMantenimientoService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.EnviarRecordatoriosAsync(
                request,
                cancellationToken);

            return Results.Ok(result);
        })
        .RequireAuthorization("TecnicoEscritura");

        return app;
    }
}
