using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Impresoras;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class ImpresoraService : IImpresoraService
{
    private readonly SigeticDbContext _dbContext;

    public ImpresoraService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ImpresoraResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Impresoras
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Include(e => e.FuncionarioAsignado)
            .OrderBy(e => e.CodigoInterno)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<ImpresoraResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var impresora = await _dbContext.Impresoras
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Include(e => e.FuncionarioAsignado)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return impresora is null ? null : ToResponse(impresora);
    }

    public async Task<ImpresoraResponse> CreateAsync(
        CrearImpresoraRequest request,
        CancellationToken cancellationToken)
    {
        ValidateImpresoraRequest(
            request.CodigoInterno,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.TipoImpresora,
            request.TecnologiaImpresion,
            request.DependenciaId,
            request.Estado,
            request.UbicacionFisica);

        await ValidateRelationsAsync(
            request.DependenciaId,
            request.FuncionarioAsignadoId,
            cancellationToken);

        bool exists = await _dbContext.Impresoras
            .AnyAsync(
                e => e.CodigoInterno == request.CodigoInterno.Trim().ToUpper() ||
                     e.Serial == request.Serial.Trim(),
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Ya existe una impresora con ese código interno o serial.");
        }

        var impresora = new Impresora(
            request.CodigoInterno,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.TipoImpresora,
            request.TecnologiaImpresion,
            request.DependenciaId,
            NormalizeNullableGuid(request.FuncionarioAsignadoId),
            request.Estado,
            request.UbicacionFisica,
            request.DireccionIp,
            request.DireccionMac,
            request.FechaIngreso,
            request.Observaciones);

        _dbContext.Impresoras.Add(impresora);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var created = await GetByIdAsync(impresora.Id, cancellationToken);

        return created!;
    }

    public async Task<ImpresoraResponse> UpdateAsync(
        Guid id,
        ActualizarImpresoraRequest request,
        CancellationToken cancellationToken)
    {
        ValidateImpresoraRequest(
            request.CodigoInterno,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.TipoImpresora,
            request.TecnologiaImpresion,
            request.DependenciaId,
            request.Estado,
            request.UbicacionFisica);

        await ValidateRelationsAsync(
            request.DependenciaId,
            request.FuncionarioAsignadoId,
            cancellationToken);

        var impresora = await _dbContext.Impresoras
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (impresora is null)
        {
            throw new KeyNotFoundException("No se encontró la impresora solicitada.");
        }

        bool exists = await _dbContext.Impresoras
            .AnyAsync(
                e => e.Id != id &&
                     (e.CodigoInterno == request.CodigoInterno.Trim().ToUpper() ||
                      e.Serial == request.Serial.Trim()),
                cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Ya existe otra impresora con ese código interno o serial.");
        }

        impresora.ActualizarDatos(
            request.CodigoInterno,
            request.Marca,
            request.Modelo,
            request.Serial,
            request.TipoImpresora,
            request.TecnologiaImpresion,
            request.DependenciaId,
            NormalizeNullableGuid(request.FuncionarioAsignadoId),
            request.Estado,
            request.UbicacionFisica,
            request.DireccionIp,
            request.DireccionMac,
            request.FechaIngreso,
            request.Observaciones);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var updated = await GetByIdAsync(impresora.Id, cancellationToken);

        return updated!;
    }

    public async Task<IReadOnlyList<MantenimientoImpresoraResponse>> GetMantenimientosAsync(
        Guid impresoraId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.MantenimientosImpresora
            .AsNoTracking()
            .Where(e => e.ImpresoraId == impresoraId)
            .OrderByDescending(e => e.FechaMantenimiento)
            .Select(e => new MantenimientoImpresoraResponse(
                e.Id,
                e.ImpresoraId,
                e.TipoMantenimiento,
                e.FechaMantenimiento,
                e.TecnicoResponsable,
                e.Diagnostico,
                e.ActividadesRealizadas,
                e.RepuestosUtilizados,
                e.ContadorPaginas,
                e.EstadoResultante,
                e.ProximaRevision,
                e.Observaciones,
                e.FirmaTecnico,
                e.FirmaRecibe,
                e.NombreRecibe,
                e.DocumentoRecibe,
                e.FechaFirmaUtc,
                e.FechaCreacionUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<MantenimientoImpresoraResponse> CreateMantenimientoAsync(
        Guid impresoraId,
        CrearMantenimientoImpresoraRequest request,
        CancellationToken cancellationToken)
    {
        ValidateMantenimientoRequest(request);

        var impresora = await _dbContext.Impresoras
            .FirstOrDefaultAsync(e => e.Id == impresoraId, cancellationToken);

        if (impresora is null)
        {
            throw new InvalidOperationException("No se encontró la impresora solicitada.");
        }

        var mantenimiento = new MantenimientoImpresora(
            impresoraId,
            request.TipoMantenimiento,
            request.FechaMantenimiento,
            request.TecnicoResponsable,
            request.Diagnostico,
            request.ActividadesRealizadas,
            request.RepuestosUtilizados,
            request.ContadorPaginas,
            request.EstadoResultante,
            request.ProximaRevision,
            request.Observaciones,
            request.FirmaTecnico,
            request.FirmaRecibe,
            request.NombreRecibe,
            request.DocumentoRecibe);

        impresora.ActualizarEstado(request.EstadoResultante);

        _dbContext.MantenimientosImpresora.Add(mantenimiento);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new MantenimientoImpresoraResponse(
            mantenimiento.Id,
            mantenimiento.ImpresoraId,
            mantenimiento.TipoMantenimiento,
            mantenimiento.FechaMantenimiento,
            mantenimiento.TecnicoResponsable,
            mantenimiento.Diagnostico,
            mantenimiento.ActividadesRealizadas,
            mantenimiento.RepuestosUtilizados,
            mantenimiento.ContadorPaginas,
            mantenimiento.EstadoResultante,
            mantenimiento.ProximaRevision,
            mantenimiento.Observaciones,
            mantenimiento.FirmaTecnico,
            mantenimiento.FirmaRecibe,
            mantenimiento.NombreRecibe,
            mantenimiento.DocumentoRecibe,
            mantenimiento.FechaFirmaUtc,
            mantenimiento.FechaCreacionUtc);
    }

    public async Task<IReadOnlyList<HistorialConsumibleImpresoraResponse>> GetHistorialConsumiblesAsync(
        Guid impresoraId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.HistorialConsumiblesImpresora
            .AsNoTracking()
            .Where(e => e.ImpresoraId == impresoraId)
            .OrderByDescending(e => e.FechaMovimiento)
            .Select(e => new HistorialConsumibleImpresoraResponse(
                e.Id,
                e.ImpresoraId,
                e.FechaMovimiento,
                e.TipoMovimiento,
                e.TipoConsumible,
                e.Referencia,
                e.Color,
                e.Cantidad,
                e.ResponsableEntrega,
                e.ContadorPaginas,
                e.Observaciones,
                e.FechaCreacionUtc))
            .ToListAsync(cancellationToken);
    }

    public async Task<HistorialConsumibleImpresoraResponse> CreateHistorialConsumibleAsync(
        Guid impresoraId,
        CrearHistorialConsumibleImpresoraRequest request,
        CancellationToken cancellationToken)
    {
        ValidateConsumibleRequest(request);

        bool exists = await _dbContext.Impresoras
            .AnyAsync(e => e.Id == impresoraId, cancellationToken);

        if (!exists)
        {
            throw new InvalidOperationException("No se encontró la impresora solicitada.");
        }

        var movimiento = new HistorialConsumibleImpresora(
            impresoraId,
            request.FechaMovimiento,
            request.TipoMovimiento,
            request.TipoConsumible,
            request.Referencia,
            request.Color,
            request.Cantidad,
            request.ResponsableEntrega,
            request.ContadorPaginas,
            request.Observaciones);

        _dbContext.HistorialConsumiblesImpresora.Add(movimiento);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new HistorialConsumibleImpresoraResponse(
            movimiento.Id,
            movimiento.ImpresoraId,
            movimiento.FechaMovimiento,
            movimiento.TipoMovimiento,
            movimiento.TipoConsumible,
            movimiento.Referencia,
            movimiento.Color,
            movimiento.Cantidad,
            movimiento.ResponsableEntrega,
            movimiento.ContadorPaginas,
            movimiento.Observaciones,
            movimiento.FechaCreacionUtc);
    }

    private async Task ValidateRelationsAsync(
        Guid dependenciaId,
        Guid? funcionarioAsignadoId,
        CancellationToken cancellationToken)
    {
        bool dependenciaExists = await _dbContext.Dependencias
            .AnyAsync(e => e.Id == dependenciaId && e.Activa, cancellationToken);

        if (!dependenciaExists)
        {
            throw new InvalidOperationException(
                "La dependencia seleccionada no existe o está inactiva.");
        }

        Guid? normalizedFuncionarioId = NormalizeNullableGuid(funcionarioAsignadoId);

        if (normalizedFuncionarioId is not null)
        {
            bool funcionarioExists = await _dbContext.Funcionarios
                .AnyAsync(
                    e => e.Id == normalizedFuncionarioId.Value && e.Activo,
                    cancellationToken);

            if (!funcionarioExists)
            {
                throw new InvalidOperationException(
                    "El funcionario seleccionado no existe o está inactivo.");
            }
        }
    }

    private static Guid? NormalizeNullableGuid(Guid? value)
    {
        if (value is null || value == Guid.Empty)
        {
            return null;
        }

        return value;
    }

    private static ImpresoraResponse ToResponse(Impresora impresora)
    {
        return new ImpresoraResponse(
            impresora.Id,
            impresora.CodigoInterno,
            impresora.Marca,
            impresora.Modelo,
            impresora.Serial,
            impresora.TipoImpresora,
            impresora.TecnologiaImpresion,
            impresora.DependenciaId,
            impresora.Dependencia?.Nombre ?? "Sin dependencia",
            impresora.FuncionarioAsignadoId,
            impresora.FuncionarioAsignado?.NombreCompleto,
            impresora.Estado,
            impresora.UbicacionFisica,
            impresora.DireccionIp,
            impresora.DireccionMac,
            impresora.FechaIngreso,
            impresora.Observaciones,
            impresora.FechaCreacionUtc);
    }

    private static void ValidateImpresoraRequest(
        string codigoInterno,
        string marca,
        string modelo,
        string serial,
        string tipoImpresora,
        string tecnologiaImpresion,
        Guid dependenciaId,
        string estado,
        string ubicacionFisica)
    {
        if (string.IsNullOrWhiteSpace(codigoInterno))
            throw new ArgumentException("El código interno es obligatorio.");

        if (string.IsNullOrWhiteSpace(marca))
            throw new ArgumentException("La marca es obligatoria.");

        if (string.IsNullOrWhiteSpace(modelo))
            throw new ArgumentException("El modelo es obligatorio.");

        if (string.IsNullOrWhiteSpace(serial))
            throw new ArgumentException("El serial es obligatorio.");

        if (string.IsNullOrWhiteSpace(tipoImpresora))
            throw new ArgumentException("El tipo de impresora es obligatorio.");

        if (string.IsNullOrWhiteSpace(tecnologiaImpresion))
            throw new ArgumentException("La tecnología de impresión es obligatoria.");

        if (dependenciaId == Guid.Empty)
            throw new ArgumentException("La dependencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(estado))
            throw new ArgumentException("El estado es obligatorio.");

        if (string.IsNullOrWhiteSpace(ubicacionFisica))
            throw new ArgumentException("La ubicación física es obligatoria.");
    }

    private static void ValidateMantenimientoRequest(
        CrearMantenimientoImpresoraRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TipoMantenimiento))
            throw new ArgumentException("El tipo de mantenimiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.TecnicoResponsable))
            throw new ArgumentException("El técnico responsable es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Diagnostico))
            throw new ArgumentException("El diagnóstico es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.ActividadesRealizadas))
            throw new ArgumentException("Las actividades realizadas son obligatorias.");

        if (string.IsNullOrWhiteSpace(request.EstadoResultante))
            throw new ArgumentException("El estado resultante es obligatorio.");
    }

    private static void ValidateConsumibleRequest(
        CrearHistorialConsumibleImpresoraRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TipoMovimiento))
            throw new ArgumentException("El tipo de movimiento es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.TipoConsumible))
            throw new ArgumentException("El tipo de consumible es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Referencia))
            throw new ArgumentException("La referencia del consumible es obligatoria.");

        if (string.IsNullOrWhiteSpace(request.Color))
            throw new ArgumentException("El color es obligatorio.");

        if (request.Cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a cero.");

        if (string.IsNullOrWhiteSpace(request.ResponsableEntrega))
            throw new ArgumentException("El responsable de entrega es obligatorio.");
    }
}
