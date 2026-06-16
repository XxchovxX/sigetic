namespace SIGETIC.Domain.Entities;

public sealed class Equipo
{
    private Equipo()
    {
    }

    public Equipo(
        string codigoInterno,
        string tipoEquipo,
        string marca,
        string modelo,
        string serial,
        string dependencia,
        string funcionarioAsignado,
        string estado,
        string procesador,
        string memoriaRam,
        string almacenamiento,
        string sistemaOperativo,
        string? direccionIp,
        string? direccionMac,
        string ubicacionFisica,
        DateOnly fechaIngreso,
        string? observaciones)
    {
        Id = Guid.NewGuid();
        CodigoInterno = codigoInterno.Trim();
        TipoEquipo = tipoEquipo.Trim();
        Marca = marca.Trim();
        Modelo = modelo.Trim();
        Serial = serial.Trim();
        Dependencia = dependencia.Trim();
        FuncionarioAsignado = funcionarioAsignado.Trim();
        Estado = estado.Trim();
        Procesador = procesador.Trim();
        MemoriaRam = memoriaRam.Trim();
        Almacenamiento = almacenamiento.Trim();
        SistemaOperativo = sistemaOperativo.Trim();
        DireccionIp = string.IsNullOrWhiteSpace(direccionIp) ? null : direccionIp.Trim();
        DireccionMac = string.IsNullOrWhiteSpace(direccionMac) ? null : direccionMac.Trim();
        UbicacionFisica = ubicacionFisica.Trim();
        FechaIngreso = fechaIngreso;
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string CodigoInterno { get; private set; } = string.Empty;
    public string TipoEquipo { get; private set; } = string.Empty;
    public string Marca { get; private set; } = string.Empty;
    public string Modelo { get; private set; } = string.Empty;
    public string Serial { get; private set; } = string.Empty;

    public string Dependencia { get; private set; } = string.Empty;
    public string FuncionarioAsignado { get; private set; } = string.Empty;
    public string Estado { get; private set; } = string.Empty;

    public string Procesador { get; private set; } = string.Empty;
    public string MemoriaRam { get; private set; } = string.Empty;
    public string Almacenamiento { get; private set; } = string.Empty;
    public string SistemaOperativo { get; private set; } = string.Empty;

    public string? DireccionIp { get; private set; }
    public string? DireccionMac { get; private set; }

    public string UbicacionFisica { get; private set; } = string.Empty;
    public DateOnly FechaIngreso { get; private set; }

    public string? Observaciones { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }
    public DateTime? FechaActualizacionUtc { get; private set; }

    public void ActualizarDatos(
        string codigoInterno,
        string tipoEquipo,
        string marca,
        string modelo,
        string serial,
        string dependencia,
        string funcionarioAsignado,
        string estado,
        string procesador,
        string memoriaRam,
        string almacenamiento,
        string sistemaOperativo,
        string? direccionIp,
        string? direccionMac,
        string ubicacionFisica,
        DateOnly fechaIngreso,
        string? observaciones)
    {
        CodigoInterno = codigoInterno.Trim();
        TipoEquipo = tipoEquipo.Trim();
        Marca = marca.Trim();
        Modelo = modelo.Trim();
        Serial = serial.Trim();
        Dependencia = dependencia.Trim();
        FuncionarioAsignado = funcionarioAsignado.Trim();
        Estado = estado.Trim();
        Procesador = procesador.Trim();
        MemoriaRam = memoriaRam.Trim();
        Almacenamiento = almacenamiento.Trim();
        SistemaOperativo = sistemaOperativo.Trim();
        DireccionIp = string.IsNullOrWhiteSpace(direccionIp) ? null : direccionIp.Trim();
        DireccionMac = string.IsNullOrWhiteSpace(direccionMac) ? null : direccionMac.Trim();
        UbicacionFisica = ubicacionFisica.Trim();
        FechaIngreso = fechaIngreso;
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void ActualizarEstado(string nuevoEstado)
    {
        if (string.IsNullOrWhiteSpace(nuevoEstado))
        {
            throw new ArgumentException("El nuevo estado del equipo es obligatorio.");
        }

        Estado = nuevoEstado.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}