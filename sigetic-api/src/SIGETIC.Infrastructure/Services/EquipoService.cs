using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Equipos;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class EquipoService : IEquipoService
{
    private readonly SigeticDbContext _dbContext;

    public EquipoService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<EquipoResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Equipos
            .AsNoTracking()
            .OrderByDescending(e => e.FechaCreacionUtc)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<EquipoResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var equipo = await _dbContext.Equipos
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return equipo is null ? null : ToResponse(equipo);
    }

    public async Task<EquipoResponse> CreateAsync(
        CrearEquipoRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRequest(
            request.CodigoInterno,
            request.TipoEquipo,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.Dependencia,
            request.FuncionarioAsignado,
            request.Estado,
            request.Procesador,
            request.MemoriaRam,
            request.Almacenamiento,
            request.SistemaOperativo,
            request.UbicacionFisica);

        bool existsByCode = await _dbContext.Equipos
            .AnyAsync(
                e => e.CodigoInterno == request.CodigoInterno.Trim(),
                cancellationToken);

        if (existsByCode)
        {
            throw new InvalidOperationException(
                "Ya existe un equipo registrado con ese código interno.");
        }

        bool existsBySerial = await _dbContext.Equipos
            .AnyAsync(
                e => e.Serial == request.Serial.Trim(),
                cancellationToken);

        if (existsBySerial)
        {
            throw new InvalidOperationException(
                "Ya existe un equipo registrado con ese serial.");
        }

        var equipo = new Equipo(
            request.CodigoInterno,
            request.TipoEquipo,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.Dependencia,
            request.FuncionarioAsignado,
            request.Estado,
            request.Procesador,
            request.MemoriaRam,
            request.Almacenamiento,
            request.SistemaOperativo,
            request.DireccionIp,
            request.DireccionMac,
            request.UbicacionFisica,
            request.FechaIngreso,
            request.Observaciones
        );

        _dbContext.Equipos.Add(equipo);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(equipo);
    }

    public async Task<EquipoResponse> UpdateAsync(
        Guid id,
        ActualizarEquipoRequest request,
        CancellationToken cancellationToken)
    {
        ValidateRequest(
            request.CodigoInterno,
            request.TipoEquipo,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.Dependencia,
            request.FuncionarioAsignado,
            request.Estado,
            request.Procesador,
            request.MemoriaRam,
            request.Almacenamiento,
            request.SistemaOperativo,
            request.UbicacionFisica);

        var equipo = await _dbContext.Equipos
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (equipo is null)
        {
            throw new KeyNotFoundException("No se encontró el equipo solicitado.");
        }

        bool existsByCode = await _dbContext.Equipos
            .AnyAsync(
                e => e.Id != id &&
                     e.CodigoInterno == request.CodigoInterno.Trim(),
                cancellationToken);

        if (existsByCode)
        {
            throw new InvalidOperationException(
                "Ya existe otro equipo registrado con ese código interno.");
        }

        bool existsBySerial = await _dbContext.Equipos
            .AnyAsync(
                e => e.Id != id &&
                     e.Serial == request.Serial.Trim(),
                cancellationToken);

        if (existsBySerial)
        {
            throw new InvalidOperationException(
                "Ya existe otro equipo registrado con ese serial.");
        }

        equipo.ActualizarDatos(
            request.CodigoInterno,
            request.TipoEquipo,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.Dependencia,
            request.FuncionarioAsignado,
            request.Estado,
            request.Procesador,
            request.MemoriaRam,
            request.Almacenamiento,
            request.SistemaOperativo,
            request.DireccionIp,
            request.DireccionMac,
            request.UbicacionFisica,
            request.FechaIngreso,
            request.Observaciones
        );

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(equipo);
    }

    private static EquipoResponse ToResponse(Equipo equipo)
    {
        return new EquipoResponse(
            equipo.Id,
            equipo.CodigoInterno,
            equipo.TipoEquipo,
            equipo.Marca,
            equipo.Modelo,
            equipo.Serial,
            equipo.Dependencia,
            equipo.FuncionarioAsignado,
            equipo.Estado,
            equipo.Procesador,
            equipo.MemoriaRam,
            equipo.Almacenamiento,
            equipo.SistemaOperativo,
            equipo.DireccionIp,
            equipo.DireccionMac,
            equipo.UbicacionFisica,
            equipo.FechaIngreso,
            equipo.Observaciones,
            equipo.FechaCreacionUtc
        );
    }

    private static void ValidateRequest(
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
        string ubicacionFisica)
    {
        if (string.IsNullOrWhiteSpace(codigoInterno))
            throw new ArgumentException("El código interno es obligatorio.");

        if (string.IsNullOrWhiteSpace(tipoEquipo))
            throw new ArgumentException("El tipo de equipo es obligatorio.");

        if (string.IsNullOrWhiteSpace(marca))
            throw new ArgumentException("La marca es obligatoria.");

        if (string.IsNullOrWhiteSpace(modelo))
            throw new ArgumentException("El modelo es obligatorio.");

        if (string.IsNullOrWhiteSpace(serial))
            throw new ArgumentException("El serial es obligatorio.");

        if (string.IsNullOrWhiteSpace(dependencia))
            throw new ArgumentException("La dependencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(funcionarioAsignado))
            throw new ArgumentException("El funcionario asignado es obligatorio.");

        if (string.IsNullOrWhiteSpace(estado))
            throw new ArgumentException("El estado es obligatorio.");

        if (string.IsNullOrWhiteSpace(procesador))
            throw new ArgumentException("El procesador es obligatorio.");

        if (string.IsNullOrWhiteSpace(memoriaRam))
            throw new ArgumentException("La memoria RAM es obligatoria.");

        if (string.IsNullOrWhiteSpace(almacenamiento))
            throw new ArgumentException("El almacenamiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(sistemaOperativo))
            throw new ArgumentException("El sistema operativo es obligatorio.");

        if (string.IsNullOrWhiteSpace(ubicacionFisica))
            throw new ArgumentException("La ubicación física es obligatoria.");
    }
}