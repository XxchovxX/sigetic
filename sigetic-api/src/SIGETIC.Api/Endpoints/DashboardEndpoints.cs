using SIGETIC.Application.Dashboard;

namespace SIGETIC.Api.Endpoints;

public static class DashboardEndpoints
{
    public static IEndpointRouteBuilder MapDashboardEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/dashboard")
            .WithTags("Dashboard")
            .RequireAuthorization("Dashboard");

        group.MapGet("/resumen", async (
            IDashboardService service,
            CancellationToken cancellationToken) =>
        {
            var resumen = await service.GetResumenAsync(cancellationToken);
            return Results.Ok(resumen);
        });

        return app;
    }
}
