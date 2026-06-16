namespace SIGETIC.Domain.Entities;

public sealed class MantenimientoEquipo
{
    private MantenimientoEquipo()
    {
    }

    public MantenimientoEquipo(
        Guid equipoId,
        string tipoMantenimiento,
        DateOnly fechaMantenimiento,
        string tecnicoResponsable,
        string diagnostico,
        string actividadesRealizadas,
        string? repuestosUtilizados,
        string estadoResultante,
        DateOnly? proximaRevision,
        string? observaciones,
        string? firmaTecnico,
        string? firmaRecibe,
        string? nombreRecibe,
        string? documentoRecibe)
    {
        Id = Guid.NewGuid();
        EquipoId = equipoId;
        TipoMantenimiento = tipoMantenimiento.Trim();
        FechaMantenimiento = fechaMantenimiento;
        TecnicoResponsable = tecnicoResponsable.Trim();
        Diagnostico = diagnostico.Trim();
        ActividadesRealizadas = actividadesRealizadas.Trim();
        RepuestosUtilizados = string.IsNullOrWhiteSpace(repuestosUtilizados)
            ? null
            : repuestosUtilizados.Trim();
        EstadoResultante = estadoResultante.Trim();
        ProximaRevision = proximaRevision;
        Observaciones = string.IsNullOrWhiteSpace(observaciones)
            ? null
            : observaciones.Trim();
        FirmaTecnico = Normalize(firmaTecnico);
        FirmaRecibe = Normalize(firmaRecibe);
        NombreRecibe = Normalize(nombreRecibe);
        DocumentoRecibe = Normalize(documentoRecibe);
        FechaFirmaUtc = FirmaTecnico is not null || FirmaRecibe is not null
            ? DateTime.UtcNow
            : null;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid EquipoId { get; private set; }

    public string TipoMantenimiento { get; private set; } = string.Empty;

    public DateOnly FechaMantenimiento { get; private set; }

    public string TecnicoResponsable { get; private set; } = string.Empty;

    public string Diagnostico { get; private set; } = string.Empty;

    public string ActividadesRealizadas { get; private set; } = string.Empty;

    public string? RepuestosUtilizados { get; private set; }

    public string EstadoResultante { get; private set; } = string.Empty;

    public DateOnly? ProximaRevision { get; private set; }

    public string? Observaciones { get; private set; }
    public string? FirmaTecnico { get; private set; }
    public string? FirmaRecibe { get; private set; }
    public string? NombreRecibe { get; private set; }
    public string? DocumentoRecibe { get; private set; }
    public DateTime? FechaFirmaUtc { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public Equipo? Equipo { get; private set; }

    private static string? Normalize(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
