namespace SIGETIC.Application.Dashboard;

public interface IDashboardService
{
    Task<DashboardResumenResponse> GetResumenAsync(
        CancellationToken cancellationToken);
}
