namespace SIGETIC.Application.Analitica;

public interface IAnaliticaService
{
    Task<AnaliticaResumenResponse> GetResumenAsync(CancellationToken cancellationToken);

    Task<HistorialConsolidadoResponse?> GetHistorialAsync(
        string codigo,
        CancellationToken cancellationToken);
}
