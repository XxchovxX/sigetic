namespace SIGETIC.Domain.Entities;

public sealed class BajaEquipo
{
    private BajaEquipo()
    {
    }

    public BajaEquipo(
        Guid equipoId,
        DateOnly fechaBaja,
        string motivoBaja,
        string responsableBaja,
        string estadoFisico,
        string disposicionFinal,
        string? observaciones)
    {
        Id = Guid.NewGuid();
        EquipoId = equipoId;
        FechaBaja = fechaBaja;
        MotivoBaja = motivoBaja.Trim();
        ResponsableBaja = responsableBaja.Trim();
        EstadoFisico = estadoFisico.Trim();
        DisposicionFinal = disposicionFinal.Trim();
        Observaciones = string.IsNullOrWhiteSpace(observaciones)
            ? null
            : observaciones.Trim();
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid EquipoId { get; private set; }

    public DateOnly FechaBaja { get; private set; }

    public string MotivoBaja { get; private set; } = string.Empty;

    public string ResponsableBaja { get; private set; } = string.Empty;

    public string EstadoFisico { get; private set; } = string.Empty;

    public string DisposicionFinal { get; private set; } = string.Empty;

    public string? Observaciones { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public Equipo? Equipo { get; private set; }
}