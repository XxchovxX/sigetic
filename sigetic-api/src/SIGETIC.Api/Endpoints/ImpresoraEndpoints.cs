using SIGETIC.Application.Impresoras;

namespace SIGETIC.Api.Endpoints;

public static class ImpresoraEndpoints
{
    public static IEndpointRouteBuilder MapImpresoraEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/impresoras")
            .WithTags("Impresoras")
            .RequireAuthorization("TecnicoLectura");

        group.MapGet("/", async (
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            var impresoras = await service.GetAllAsync(cancellationToken);
            return Results.Ok(impresoras);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            var impresora = await service.GetByIdAsync(id, cancellationToken);

            if (impresora is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontró la impresora solicitada."
                });
            }

            return Results.Ok(impresora);
        });

        group.MapPost("/", async (
            CrearImpresoraRequest request,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var impresora = await service.CreateAsync(request, cancellationToken);
                return Results.Created($"/api/impresoras/{impresora.Id}", impresora);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.Conflict(new { message = exception.Message });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapPut("/{id:guid}", async (
            Guid id,
            ActualizarImpresoraRequest request,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var impresora = await service.UpdateAsync(id, request, cancellationToken);
                return Results.Ok(impresora);
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
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapGet("/{impresoraId:guid}/mantenimientos", async (
            Guid impresoraId,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            var mantenimientos = await service.GetMantenimientosAsync(
                impresoraId,
                cancellationToken);

            return Results.Ok(mantenimientos);
        });

        group.MapPost("/{impresoraId:guid}/mantenimientos", async (
            Guid impresoraId,
            CrearMantenimientoImpresoraRequest request,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var mantenimiento = await service.CreateMantenimientoAsync(
                    impresoraId,
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/impresoras/{impresoraId}/mantenimientos/{mantenimiento.Id}",
                    mantenimiento);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
        })
        .RequireAuthorization("TecnicoEscritura");

        group.MapGet("/{impresoraId:guid}/consumibles", async (
            Guid impresoraId,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            var historial = await service.GetHistorialConsumiblesAsync(
                impresoraId,
                cancellationToken);

            return Results.Ok(historial);
        });

        group.MapPost("/{impresoraId:guid}/consumibles", async (
            Guid impresoraId,
            CrearHistorialConsumibleImpresoraRequest request,
            IImpresoraService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var movimiento = await service.CreateHistorialConsumibleAsync(
                    impresoraId,
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/impresoras/{impresoraId}/consumibles/{movimiento.Id}",
                    movimiento);
            }
            catch (ArgumentException exception)
            {
                return Results.BadRequest(new { message = exception.Message });
            }
            catch (InvalidOperationException exception)
            {
                return Results.NotFound(new { message = exception.Message });
            }
        })
        .RequireAuthorization("Consumibles");

        return app;
    }
}
