namespace SIGETIC.Domain.Entities;

public sealed class Impresora
{
    private Impresora()
    {
    }

    public Impresora(
        string codigoInterno,
        string marca,
        string modelo,
        string serial,
        string tipoImpresora,
        string tecnologiaImpresion,
        Guid dependenciaId,
        Guid? funcionarioAsignadoId,
        string estado,
        string ubicacionFisica,
        string? direccionIp,
        string? direccionMac,
        DateOnly fechaIngreso,
        string? observaciones)
    {
        Id = Guid.NewGuid();
        CodigoInterno = codigoInterno.Trim().ToUpperInvariant();
        Marca = marca.Trim();
        Modelo = modelo.Trim();
        Serial = serial.Trim();
        TipoImpresora = tipoImpresora.Trim();
        TecnologiaImpresion = tecnologiaImpresion.Trim();
        DependenciaId = dependenciaId;
        FuncionarioAsignadoId = funcionarioAsignadoId;
        Estado = estado.Trim();
        UbicacionFisica = ubicacionFisica.Trim();
        DireccionIp = string.IsNullOrWhiteSpace(direccionIp) ? null : direccionIp.Trim();
        DireccionMac = string.IsNullOrWhiteSpace(direccionMac) ? null : direccionMac.Trim();
        FechaIngreso = fechaIngreso;
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public string CodigoInterno { get; private set; } = string.Empty;

    public string Marca { get; private set; } = string.Empty;

    public string Modelo { get; private set; } = string.Empty;

    public string Serial { get; private set; } = string.Empty;

    public string TipoImpresora { get; private set; } = string.Empty;

    public string TecnologiaImpresion { get; private set; } = string.Empty;

    public Guid DependenciaId { get; private set; }

    public Guid? FuncionarioAsignadoId { get; private set; }

    public string Estado { get; private set; } = string.Empty;

    public string UbicacionFisica { get; private set; } = string.Empty;

    public string? DireccionIp { get; private set; }

    public string? DireccionMac { get; private set; }

    public DateOnly FechaIngreso { get; private set; }

    public string? Observaciones { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public DateTime? FechaActualizacionUtc { get; private set; }

    public Dependencia? Dependencia { get; private set; }

    public Funcionario? FuncionarioAsignado { get; private set; }

    public void ActualizarDatos(
        string codigoInterno,
        string marca,
        string modelo,
        string serial,
        string tipoImpresora,
        string tecnologiaImpresion,
        Guid dependenciaId,
        Guid? funcionarioAsignadoId,
        string estado,
        string ubicacionFisica,
        string? direccionIp,
        string? direccionMac,
        DateOnly fechaIngreso,
        string? observaciones)
    {
        CodigoInterno = codigoInterno.Trim().ToUpperInvariant();
        Marca = marca.Trim();
        Modelo = modelo.Trim();
        Serial = serial.Trim();
        TipoImpresora = tipoImpresora.Trim();
        TecnologiaImpresion = tecnologiaImpresion.Trim();
        DependenciaId = dependenciaId;
        FuncionarioAsignadoId = funcionarioAsignadoId;
        Estado = estado.Trim();
        UbicacionFisica = ubicacionFisica.Trim();
        DireccionIp = string.IsNullOrWhiteSpace(direccionIp) ? null : direccionIp.Trim();
        DireccionMac = string.IsNullOrWhiteSpace(direccionMac) ? null : direccionMac.Trim();
        FechaIngreso = fechaIngreso;
        Observaciones = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }

    public void ActualizarEstado(string estado)
    {
        Estado = estado.Trim();
        FechaActualizacionUtc = DateTime.UtcNow;
    }
}