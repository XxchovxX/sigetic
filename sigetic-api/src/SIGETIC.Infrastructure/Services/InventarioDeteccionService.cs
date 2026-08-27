using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Equipos;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class InventarioDeteccionService : IInventarioDeteccionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly SigeticDbContext _dbContext;

    public InventarioDeteccionService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CrearInventarioDeteccionResponse> CreateAsync(
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var usuarioExiste = await _dbContext.Usuarios
            .AsNoTracking()
            .AnyAsync(e => e.Id == usuarioId && e.Activo, cancellationToken);

        if (!usuarioExiste)
            throw new UnauthorizedAccessException("No se encontro el usuario autenticado.");

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32))
            .ToLowerInvariant();
        var expiraUtc = DateTime.UtcNow.AddMinutes(20);
        var deteccion = new InventarioDeteccion(
            usuarioId,
            HashToken(token),
            expiraUtc);

        _dbContext.InventarioDetecciones.Add(deteccion);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CrearInventarioDeteccionResponse(
            deteccion.Id,
            token,
            deteccion.ExpiraUtc);
    }

    public async Task ReceiveAsync(
        string token,
        ReportarInventarioDeteccionRequest request,
        string? direccionIpOrigen,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length != 64)
            throw new UnauthorizedAccessException("El codigo de deteccion no es valido.");

        var tokenHash = HashToken(token);
        var deteccion = await _dbContext.InventarioDetecciones
            .FirstOrDefaultAsync(e => e.TokenHash == tokenHash, cancellationToken);

        if (deteccion is null)
            throw new UnauthorizedAccessException("El codigo de deteccion no es valido.");

        if (deteccion.Estado != "Pendiente")
            throw new InvalidOperationException("Esta deteccion ya fue recibida.");

        if (deteccion.EstaExpirada(DateTime.UtcNow))
            throw new InvalidOperationException("El codigo de deteccion ya expiro. Genera uno nuevo en SIGETIC.");

        var normalized = Normalize(request);
        deteccion.RegistrarDatos(
            JsonSerializer.Serialize(normalized, JsonOptions),
            direccionIpOrigen);

        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new InvalidOperationException("Esta deteccion ya fue recibida.");
        }
    }

    public async Task<EstadoInventarioDeteccionResponse?> GetStatusAsync(
        Guid id,
        Guid usuarioId,
        CancellationToken cancellationToken)
    {
        var deteccion = await _dbContext.InventarioDetecciones
            .AsNoTracking()
            .FirstOrDefaultAsync(
                e => e.Id == id && e.UsuarioId == usuarioId,
                cancellationToken);

        if (deteccion is null)
            return null;

        var estado = deteccion.Estado == "Pendiente" && deteccion.EstaExpirada(DateTime.UtcNow)
            ? "Expirada"
            : deteccion.Estado;

        ReportarInventarioDeteccionRequest? datos = null;
        Guid? equipoExistenteId = null;

        if (!string.IsNullOrWhiteSpace(deteccion.DatosJson))
        {
            datos = JsonSerializer.Deserialize<ReportarInventarioDeteccionRequest>(
                deteccion.DatosJson,
                JsonOptions);

            if (!string.IsNullOrWhiteSpace(datos?.Serial))
            {
                var serial = datos.Serial.Trim().ToUpperInvariant();
                equipoExistenteId = await _dbContext.Equipos
                    .AsNoTracking()
                    .Where(e => e.Serial.ToUpper() == serial)
                    .Select(e => (Guid?)e.Id)
                    .FirstOrDefaultAsync(cancellationToken);
            }
        }

        return new EstadoInventarioDeteccionResponse(
            deteccion.Id,
            estado,
            deteccion.ExpiraUtc,
            deteccion.FechaRecepcionUtc,
            datos,
            equipoExistenteId);
    }

    private static ReportarInventarioDeteccionRequest Normalize(
        ReportarInventarioDeteccionRequest request)
    {
        var discos = (request.Discos ?? [])
            .Take(12)
            .Select(e => new DiscoInventarioDetectadoRequest(
                Clean(e.Modelo, 120),
                Math.Max(e.CapacidadBytes, 0),
                Clean(e.Tipo, 40)))
            .ToList();

        return new ReportarInventarioDeteccionRequest(
            Clean(request.NombreEquipo, 120, "Equipo Windows"),
            Clean(request.Fabricante, 80, "No identificado"),
            Clean(request.Modelo, 100, "No identificado"),
            Clean(request.Serial, 120, request.UuidHardware ?? "No identificado"),
            Clean(request.UuidHardware, 120),
            Clean(request.TipoEquipo, 80, "Computador de escritorio"),
            Clean(request.Procesador, 120, "No identificado"),
            Math.Clamp(request.MemoriaRamGb, 0, 4096),
            discos,
            Clean(request.SistemaOperativo, 120, "Windows"),
            Clean(request.VersionSistemaOperativo, 80),
            Clean(request.Arquitectura, 40),
            Clean(request.DireccionIp, 45),
            Clean(request.DireccionMac, 50),
            Clean(request.UsuarioActual, 180),
            Clean(request.BiosVersion, 180),
            Clean(request.FechaInstalacion, 40));
    }

    private static string? Clean(string? value, int maxLength, string? fallback = null)
    {
        var normalized = string.IsNullOrWhiteSpace(value)
            ? fallback
            : value.Trim();

        if (string.IsNullOrWhiteSpace(normalized))
            return null;

        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }

    private static string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}
