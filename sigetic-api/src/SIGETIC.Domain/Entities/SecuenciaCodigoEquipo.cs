namespace SIGETIC.Domain.Entities;

public sealed class SecuenciaCodigoEquipo
{
    private SecuenciaCodigoEquipo()
    {
    }

    public string Clave { get; private set; } = string.Empty;

    public int UltimoNumero { get; private set; }

    public DateTime FechaActualizacionUtc { get; private set; }
}
