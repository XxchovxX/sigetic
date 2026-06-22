using SIGETIC.Application.Auditoria;

namespace SIGETIC.Api.Endpoints;

public static class AuditoriaEndpoints
{
    public static IEndpointRouteBuilder MapAuditoriaEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auditoria")
            .WithTags("Auditoria")
            .RequireAuthorization("Auditoria");

        group.MapGet("/", async (
            string? modulo,
            string? accion,
            string? usuario,
            DateTime? desdeUtc,
            DateTime? hastaUtc,
            int? take,
            IAuditoriaService auditoriaService,
            CancellationToken cancellationToken) =>
        {
            var registros = await auditoriaService.GetAsync(
                modulo,
                accion,
                usuario,
                desdeUtc,
                hastaUtc,
                take ?? 100,
                cancellationToken);

            return Results.Ok(registros);
        });

        return app;
    }
}
