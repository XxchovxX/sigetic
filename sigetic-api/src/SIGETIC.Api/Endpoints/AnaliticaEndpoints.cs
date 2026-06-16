using SIGETIC.Application.Analitica;

namespace SIGETIC.Api.Endpoints;

public static class AnaliticaEndpoints
{
    public static IEndpointRouteBuilder MapAnaliticaEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/analitica")
            .WithTags("Analitica")
            .RequireAuthorization("ReportesAnalitica");

        group.MapGet("/", async (
            IAnaliticaService analiticaService,
            CancellationToken cancellationToken) =>
        {
            var resumen = await analiticaService.GetResumenAsync(cancellationToken);

            return Results.Ok(resumen);
        });

        group.MapGet("/historial/{codigo}", async (
            string codigo,
            IAnaliticaService analiticaService,
            CancellationToken cancellationToken) =>
        {
            var historial = await analiticaService.GetHistorialAsync(
                codigo,
                cancellationToken);

            if (historial is null)
            {
                return Results.NotFound(new
                {
                    message = "No se encontró un activo con ese código."
                });
            }

            return Results.Ok(historial);
        });

        return app;
    }
}
