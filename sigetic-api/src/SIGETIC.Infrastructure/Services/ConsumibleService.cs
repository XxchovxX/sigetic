using Microsoft.EntityFrameworkCore;
using SIGETIC.Application.Consumibles;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Infrastructure.Services;

public sealed class ConsumibleService : IConsumibleService
{
    private const string MovimientoEntrada = "Entrada";
    private const string MovimientoSalida = "Salida";
    private const string MovimientoAjuste = "Ajuste";

    private readonly SigeticDbContext _dbContext;

    public ConsumibleService(SigeticDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ConsumibleResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Consumibles
            .AsNoTracking()
            .OrderBy(e => e.CodigoInterno)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ConsumibleResponse>> GetBajoStockAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Consumibles
            .AsNoTracking()
            .Where(e => e.Activo && e.StockActual <= e.StockMinimo)
            .OrderBy(e => e.StockActual)
            .ThenBy(e => e.CodigoInterno)
            .Select(e => ToResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<ConsumibleResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken)
    {
        var consumible = await _dbContext.Consumibles
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        return consumible is null ? null : ToResponse(consumible);
    }

    public async Task<ConsumibleResponse> CreateAsync(
        CrearConsumibleRequest request,
        CancellationToken cancellationToken)
    {
        ValidateConsumibleRequest(
            request.CodigoInterno,
            request.Nombre,
            request.TipoConsumible,
            request.Referencia,
            request.Color,
            request.UnidadMedida,
            request.StockActual,
            request.StockMinimo,
            request.CostoUnitario);

        var codigo = request.CodigoInterno.Trim().ToUpperInvariant();

        bool exists = await _dbContext.Consumibles
            .AnyAsync(e => e.CodigoInterno == codigo, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Ya existe un consumible con ese código interno.");
        }

        var consumible = new Consumible(
            request.CodigoInterno,
            request.Nombre,
            request.TipoConsumible,
            request.Referencia,
            request.Color,
            request.UnidadMedida,
            request.StockActual,
            request.StockMinimo,
            request.CostoUnitario,
            request.MarcaCompatible,
            request.ModelosCompatibles,
            request.Observaciones);

        _dbContext.Consumibles.Add(consumible);

        if (request.StockActual > 0)
        {
            _dbContext.MovimientosConsumibles.Add(
                new MovimientoConsumible(
                    consumible.Id,
                    DateOnly.FromDateTime(DateTime.UtcNow),
                    MovimientoEntrada,
                    request.StockActual,
                    "Registro inicial",
                    "Inventario inicial",
                    null,
                    null,
                    null,
                    "Stock inicial registrado con el consumible.",
                    request.StockActual,
                    request.CostoUnitario));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(consumible);
    }

    public async Task<ConsumibleResponse> UpdateAsync(
        Guid id,
        ActualizarConsumibleRequest request,
        CancellationToken cancellationToken)
    {
        ValidateConsumibleRequest(
            request.CodigoInterno,
            request.Nombre,
            request.TipoConsumible,
            request.Referencia,
            request.Color,
            request.UnidadMedida,
            0,
            request.StockMinimo,
            request.CostoUnitario);

        var consumible = await _dbContext.Consumibles
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

        if (consumible is null)
        {
            throw new KeyNotFoundException("No se encontró el consumible solicitado.");
        }

        var codigo = request.CodigoInterno.Trim().ToUpperInvariant();

        bool exists = await _dbContext.Consumibles
            .AnyAsync(e => e.Id != id && e.CodigoInterno == codigo, cancellationToken);

        if (exists)
        {
            throw new InvalidOperationException(
                "Ya existe otro consumible con ese código interno.");
        }

        consumible.ActualizarDatos(
            request.CodigoInterno,
            request.Nombre,
            request.TipoConsumible,
            request.Referencia,
            request.Color,
            request.UnidadMedida,
            request.StockMinimo,
            request.CostoUnitario,
            request.MarcaCompatible,
            request.ModelosCompatibles,
            request.Observaciones,
            request.Activo);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(consumible);
    }

    public async Task<IReadOnlyList<MovimientoConsumibleResponse>> GetMovimientosAsync(
        Guid consumibleId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.MovimientosConsumibles
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Include(e => e.Impresora)
            .Where(e => e.ConsumibleId == consumibleId)
            .OrderByDescending(e => e.FechaMovimiento)
            .ThenByDescending(e => e.FechaCreacionUtc)
            .Select(e => ToMovimientoResponse(e))
            .ToListAsync(cancellationToken);
    }

    public async Task<MovimientoConsumibleResponse> CreateMovimientoAsync(
        Guid consumibleId,
        CrearMovimientoConsumibleRequest request,
        CancellationToken cancellationToken)
    {
        ValidateMovimientoRequest(request);

        var consumible = await _dbContext.Consumibles
            .FirstOrDefaultAsync(e => e.Id == consumibleId, cancellationToken);

        if (consumible is null)
        {
            throw new KeyNotFoundException("No se encontró el consumible solicitado.");
        }

        if (!consumible.Activo)
        {
            throw new InvalidOperationException(
                "No se pueden registrar movimientos sobre un consumible inactivo.");
        }

        Guid? dependenciaId = NormalizeNullableGuid(request.DependenciaId);
        Guid? impresoraId = NormalizeNullableGuid(request.ImpresoraId);

        await ValidateRelationsAsync(dependenciaId, impresoraId, cancellationToken);

        string tipoMovimiento = NormalizeTipoMovimiento(request.TipoMovimiento);
        int stockResultante = ApplyStockRule(consumible, tipoMovimiento, request.Cantidad);

        var costoUnitario = request.CostoUnitario ?? consumible.CostoUnitario;

        var movimiento = new MovimientoConsumible(
            consumible.Id,
            request.FechaMovimiento,
            tipoMovimiento,
            request.Cantidad,
            request.Responsable,
            request.Destino,
            dependenciaId,
            impresoraId,
            request.DocumentoSoporte,
            request.Observaciones,
            stockResultante,
            costoUnitario);

        _dbContext.MovimientosConsumibles.Add(movimiento);

        if (tipoMovimiento == MovimientoSalida && impresoraId is not null)
        {
            _dbContext.HistorialConsumiblesImpresora.Add(
                new HistorialConsumibleImpresora(
                    impresoraId.Value,
                    request.FechaMovimiento,
                    "Entrega desde inventario",
                    consumible.TipoConsumible,
                    consumible.Referencia,
                    consumible.Color,
                    request.Cantidad,
                    request.Responsable,
                    null,
                    request.Observaciones));
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        var created = await _dbContext.MovimientosConsumibles
            .AsNoTracking()
            .Include(e => e.Dependencia)
            .Include(e => e.Impresora)
            .FirstAsync(e => e.Id == movimiento.Id, cancellationToken);

        return ToMovimientoResponse(created);
    }

    private async Task ValidateRelationsAsync(
        Guid? dependenciaId,
        Guid? impresoraId,
        CancellationToken cancellationToken)
    {
        if (dependenciaId is not null)
        {
            bool dependenciaExists = await _dbContext.Dependencias
                .AnyAsync(e => e.Id == dependenciaId.Value && e.Activa, cancellationToken);

            if (!dependenciaExists)
            {
                throw new InvalidOperationException(
                    "La dependencia seleccionada no existe o esta inactiva.");
            }
        }

        if (impresoraId is not null)
        {
            bool impresoraExists = await _dbContext.Impresoras
                .AnyAsync(e => e.Id == impresoraId.Value, cancellationToken);

            if (!impresoraExists)
            {
                throw new InvalidOperationException(
                    "La impresora seleccionada no existe.");
            }
        }
    }

    private static int ApplyStockRule(
        Consumible consumible,
        string tipoMovimiento,
        int cantidad)
    {
        if (tipoMovimiento == MovimientoEntrada)
        {
            consumible.RegistrarEntrada(cantidad);
            return consumible.StockActual;
        }

        if (tipoMovimiento == MovimientoSalida)
        {
            if (consumible.StockActual < cantidad)
            {
                throw new InvalidOperationException(
                    "No hay stock suficiente para registrar la salida.");
            }

            consumible.RegistrarSalida(cantidad);
            return consumible.StockActual;
        }

        consumible.AjustarStock(cantidad);
        return consumible.StockActual;
    }

    private static string NormalizeTipoMovimiento(string tipoMovimiento)
    {
        var normalized = tipoMovimiento.Trim();

        if (normalized.Equals(MovimientoEntrada, StringComparison.OrdinalIgnoreCase))
            return MovimientoEntrada;

        if (normalized.Equals(MovimientoSalida, StringComparison.OrdinalIgnoreCase))
            return MovimientoSalida;

        if (normalized.Equals(MovimientoAjuste, StringComparison.OrdinalIgnoreCase))
            return MovimientoAjuste;

        throw new ArgumentException(
            "El tipo de movimiento debe ser Entrada, Salida o Ajuste.");
    }

    private static Guid? NormalizeNullableGuid(Guid? value)
    {
        if (value is null || value == Guid.Empty)
        {
            return null;
        }

        return value;
    }

    private static ConsumibleResponse ToResponse(Consumible consumible)
    {
        return new ConsumibleResponse(
            consumible.Id,
            consumible.CodigoInterno,
            consumible.Nombre,
            consumible.TipoConsumible,
            consumible.Referencia,
            consumible.Color,
            consumible.UnidadMedida,
            consumible.StockActual,
            consumible.StockMinimo,
            consumible.CostoUnitario,
            consumible.BajoStock,
            consumible.MarcaCompatible,
            consumible.ModelosCompatibles,
            consumible.Observaciones,
            consumible.Activo,
            consumible.FechaCreacionUtc,
            consumible.FechaActualizacionUtc);
    }

    private static MovimientoConsumibleResponse ToMovimientoResponse(
        MovimientoConsumible movimiento)
    {
        return new MovimientoConsumibleResponse(
            movimiento.Id,
            movimiento.ConsumibleId,
            movimiento.FechaMovimiento,
            movimiento.TipoMovimiento,
            movimiento.Cantidad,
            movimiento.Responsable,
            movimiento.Destino,
            movimiento.DependenciaId,
            movimiento.Dependencia?.Nombre,
            movimiento.ImpresoraId,
            movimiento.Impresora is null
                ? null
                : $"{movimiento.Impresora.CodigoInterno} - {movimiento.Impresora.Marca} {movimiento.Impresora.Modelo}",
            movimiento.DocumentoSoporte,
            movimiento.Observaciones,
            movimiento.StockResultante,
            movimiento.CostoUnitario,
            movimiento.CostoTotal,
            movimiento.FechaCreacionUtc);
    }

    private static void ValidateConsumibleRequest(
        string codigoInterno,
        string nombre,
        string tipoConsumible,
        string referencia,
        string color,
        string unidadMedida,
        int stockActual,
        int stockMinimo,
        decimal costoUnitario)
    {
        if (string.IsNullOrWhiteSpace(codigoInterno))
            throw new ArgumentException("El código interno es obligatorio.");

        if (string.IsNullOrWhiteSpace(nombre))
            throw new ArgumentException("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(tipoConsumible))
            throw new ArgumentException("El tipo de consumible es obligatorio.");

        if (string.IsNullOrWhiteSpace(referencia))
            throw new ArgumentException("La referencia es obligatoria.");

        if (string.IsNullOrWhiteSpace(color))
            throw new ArgumentException("El color es obligatorio.");

        if (string.IsNullOrWhiteSpace(unidadMedida))
            throw new ArgumentException("La unidad de medida es obligatoria.");

        if (stockActual < 0)
            throw new ArgumentException("El stock inicial no puede ser negativo.");

        if (stockMinimo < 0)
            throw new ArgumentException("El stock minimo no puede ser negativo.");

        if (costoUnitario < 0)
            throw new ArgumentException("El costo unitario no puede ser negativo.");
    }

    private static void ValidateMovimientoRequest(
        CrearMovimientoConsumibleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.TipoMovimiento))
            throw new ArgumentException("El tipo de movimiento es obligatorio.");

        if (request.Cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a cero.");

        if (string.IsNullOrWhiteSpace(request.Responsable))
            throw new ArgumentException("El responsable es obligatorio.");
    }
}
