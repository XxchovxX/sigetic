using SIGETIC.Application.Consumibles;

namespace SIGETIC.Api.Endpoints;

public static class ConsumibleEndpoints
{
    public static IEndpointRouteBuilder MapConsumibleEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/consumibles")
            .WithTags("Consumibles")
            .RequireAuthorization("Consumibles");

        group.MapGet("/", async (
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            var consumibles = await service.GetAllAsync(cancellationToken);
            return Results.Ok(consumibles);
        });

        group.MapGet("/bajo-stock", async (
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            var consumibles = await service.GetBajoStockAsync(cancellationToken);
            return Results.Ok(consumibles);
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            var consumible = await service.GetByIdAsync(id, cancellationToken);

            if (consumible is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontró el consumible solicitado."
                });
            }

            return Results.Ok(consumible);
        });

        group.MapPost("/", async (
            CrearConsumibleRequest request,
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var consumible = await service.CreateAsync(request, cancellationToken);
                return Results.Created($"/api/consumibles/{consumible.Id}", consumible);
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

        group.MapPut("/{id:guid}", async (
            Guid id,
            ActualizarConsumibleRequest request,
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var consumible = await service.UpdateAsync(id, request, cancellationToken);
                return Results.Ok(consumible);
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

        group.MapGet("/{consumibleId:guid}/movimientos", async (
            Guid consumibleId,
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            var movimientos = await service.GetMovimientosAsync(
                consumibleId,
                cancellationToken);

            return Results.Ok(movimientos);
        });

        group.MapPost("/{consumibleId:guid}/movimientos", async (
            Guid consumibleId,
            CrearMovimientoConsumibleRequest request,
            IConsumibleService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var movimiento = await service.CreateMovimientoAsync(
                    consumibleId,
                    request,
                    cancellationToken);

                return Results.Created(
                    $"/api/consumibles/{consumibleId}/movimientos/{movimiento.Id}",
                    movimiento);
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
