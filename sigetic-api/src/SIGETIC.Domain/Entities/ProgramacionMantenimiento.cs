namespace SIGETIC.Domain.Entities;

public sealed class ProgramacionMantenimiento
{
    private ProgramacionMantenimiento()
    {
    }

    public ProgramacionMantenimiento(
        string tipoActivo,
        Guid? equipoId,
        Guid? impresoraId,
        string codigoActivo,
        string nombreActivo,
        string tipoMantenimiento,
        DateOnly fechaProgramada,
        TimeOnly? horaProgramada,
        string frecuencia,
        string tecnicoResponsable,
        string? correoTecnico,
        string? observaciones)
    {
        Validate(tipoActivo, equipoId, impresoraId, codigoActivo, nombreActivo, tipoMantenimiento, frecuencia, tecnicoResponsable);

        Id = Guid.NewGuid();
        TipoActivo = tipoActivo.Trim();
        EquipoId = equipoId;
        ImpresoraId = impresoraId;
        CodigoActivo = codigoActivo.Trim();
        NombreActivo = nombreActivo.Trim();
        TipoMantenimiento = tipoMantenimiento.Trim();
        FechaProgramada = fechaProgramada;
        HoraProgramada = horaProgramada;
        Frecuencia = frecuencia.Trim();
        Estado = "Programado";
        TecnicoResponsable = tecnicoResponsable.Trim();
        CorreoTecnico = NormalizeOptional(correoTecnico);
        Observaciones = NormalizeOptional(observaciones);
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }
    public string TipoActivo { get; private set; } = string.Empty;
    public Guid? EquipoId { get; private set; }
    public Guid? ImpresoraId { get; private set; }
    public string CodigoActivo { get; private set; } = string.Empty;
    public string NombreActivo { get; private set; } = string.Empty;
    public string TipoMantenimiento { get; private set; } = string.Empty;
    public DateOnly FechaProgramada { get; private set; }
    public TimeOnly? HoraProgramada { get; private set; }
    public string Frecuencia { get; private set; } = string.Empty;
    public string Estado { get; private set; } = string.Empty;
    public string TecnicoResponsable { get; private set; } = string.Empty;
    public string? CorreoTecnico { get; private set; }
    public string? Observaciones { get; private set; }
    public DateTime? UltimaNotificacionUtc { get; private set; }
    public DateTime FechaCreacionUtc { get; private set; }
    public DateTime? FechaActualizacionUtc { get; private set; }

    public Equipo? Equipo { get; private set; }
    public Impresora? Impresora { get; private set; }

    public void Actualizar(
        DateOnly fechaProgramada,
        TimeOnly? horaProgramada,
        string frecuencia,
        string tecnicoResponsable,
        string? correoTecnico,
        string? observaciones)
    {
        if (string.IsNullOrWhiteSpace(frecuencia))
            throw new ArgumentException("La frecuencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(tecnicoResponsable))
            throw new ArgumentException("El tecnico responsable es obligatorio.");

        FechaProgramada = fechaProgramada;
        HoraProgramada = horaProgramada;
        Frecuencia = frecuencia.Trim();
        TecnicoResponsable = tecnicoResponsable.Trim();
        CorreoTecnico = NormalizeOptional(correoTecnico);
        Observaciones = NormalizeOptional(observaciones);
        FechaActualizacionUtc = DateTime.UtcNow;

        if (Estado is "Vencido" && fechaProgramada >= DateOnly.FromDateTime(DateTime.UtcNow))
        {
            Estado = "Programado";
        }
    }

    public void MarcarNotificado()
    {
        UltimaNotificacionUtc = DateTime.UtcNow;

        if (Estado == "Programado")
        {
            Estado = "Notificado";
        }

        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void MarcarEjecutado()
    {
        Estado = "Ejecutado";
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void MarcarVencido()
    {
        if (Estado is "Programado" or "Notificado")
        {
            Estado = "Vencido";
            FechaActualizacionUtc = DateTime.UtcNow;
        }
    }

    public void Cancelar()
    {
        Estado = "Cancelado";
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    private static void Validate(
        string tipoActivo,
        Guid? equipoId,
        Guid? impresoraId,
        string codigoActivo,
        string nombreActivo,
        string tipoMantenimiento,
        string frecuencia,
        string tecnicoResponsable)
    {
        if (tipoActivo is not ("Equipo" or "Impresora"))
            throw new ArgumentException("El tipo de activo debe ser Equipo o Impresora.");

        if (tipoActivo == "Equipo" && equipoId is null)
            throw new ArgumentException("Debe seleccionar un equipo.");

        if (tipoActivo == "Impresora" && impresoraId is null)
            throw new ArgumentException("Debe seleccionar una impresora.");

        if (string.IsNullOrWhiteSpace(codigoActivo))
            throw new ArgumentException("El codigo del activo es obligatorio.");

        if (string.IsNullOrWhiteSpace(nombreActivo))
            throw new ArgumentException("El nombre del activo es obligatorio.");

        if (string.IsNullOrWhiteSpace(tipoMantenimiento))
            throw new ArgumentException("El tipo de mantenimiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(frecuencia))
            throw new ArgumentException("La frecuencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(tecnicoResponsable))
            throw new ArgumentException("El tecnico responsable es obligatorio.");
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
