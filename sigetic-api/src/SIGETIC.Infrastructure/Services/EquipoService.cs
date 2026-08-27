using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
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

    public async Task<CodigoEquipoSugeridoResponse> GetCodigoSugeridoAsync(
        string tipoEquipo,
        string dependencia,
        CancellationToken cancellationToken)
    {
        var segmentos = await ResolveCodeSegmentsAsync(
            tipoEquipo,
            dependencia,
            cancellationToken);
        int nextNumber = await _dbContext.SecuenciasCodigoEquipo
            .AsNoTracking()
            .Where(sequence => sequence.Clave == segmentos.Key)
            .Select(sequence => sequence.UltimoNumero + 1)
            .FirstOrDefaultAsync(cancellationToken);

        if (nextNumber <= 0)
            nextNumber = 1;

        string code = FormatCode(segmentos, nextNumber);

        while (await _dbContext.Equipos
            .AsNoTracking()
            .AnyAsync(equipment => equipment.CodigoInterno == code, cancellationToken))
        {
            nextNumber++;
            code = FormatCode(segmentos, nextNumber);
        }

        return new CodigoEquipoSugeridoResponse(
            code,
            segmentos.TypePrefix,
            segmentos.DependencyCode,
            true);
    }

    public async Task<EquipoResponse> CreateAsync(
        CrearEquipoRequest request,
        CancellationToken cancellationToken)
    {
        if (request.GenerarCodigoAutomatico)
        {
            ValidateRequest(
                "CODIGO-AUTOMATICO",
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

            await using var transaction = await _dbContext.Database
                .BeginTransactionAsync(cancellationToken);
            string generatedCode = await GenerateNextCodeAsync(
                request.TipoEquipo,
                request.Dependencia,
                cancellationToken);
            var created = await CreateWithCodeAsync(
                request,
                generatedCode,
                cancellationToken);

            await transaction.CommitAsync(cancellationToken);
            return created;
        }

        return await CreateWithCodeAsync(
            request,
            request.CodigoInterno,
            cancellationToken);
    }

    private async Task<EquipoResponse> CreateWithCodeAsync(
        CrearEquipoRequest request,
        string codigoInterno,
        CancellationToken cancellationToken)
    {
        ValidateRequest(
            codigoInterno,
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
                e => e.CodigoInterno == codigoInterno.Trim(),
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
            codigoInterno,
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

    private async Task<string> GenerateNextCodeAsync(
        string tipoEquipo,
        string dependencia,
        CancellationToken cancellationToken)
    {
        var segments = await ResolveCodeSegmentsAsync(
            tipoEquipo,
            dependencia,
            cancellationToken);

        while (true)
        {
            int nextNumber = await IncrementSequenceAsync(
                segments.Key,
                cancellationToken);
            string code = FormatCode(segments, nextNumber);
            bool alreadyExists = await _dbContext.Equipos
                .AsNoTracking()
                .AnyAsync(equipment => equipment.CodigoInterno == code, cancellationToken);

            if (!alreadyExists)
                return code;
        }
    }

    private async Task<int> IncrementSequenceAsync(
        string key,
        CancellationToken cancellationToken)
    {
        var connection = (NpgsqlConnection)_dbContext.Database.GetDbConnection();
        var transaction = (NpgsqlTransaction?)_dbContext.Database
            .CurrentTransaction?
            .GetDbTransaction();

        if (connection.State != System.Data.ConnectionState.Open)
            await connection.OpenAsync(cancellationToken);

        await using var command = new NpgsqlCommand(
            """
            INSERT INTO secuencias_codigo_equipo (clave, ultimo_numero, fecha_actualizacion_utc)
            VALUES (@clave, 1, @fecha_actualizacion_utc)
            ON CONFLICT (clave) DO UPDATE
            SET ultimo_numero = secuencias_codigo_equipo.ultimo_numero + 1,
                fecha_actualizacion_utc = EXCLUDED.fecha_actualizacion_utc
            RETURNING ultimo_numero;
            """,
            connection,
            transaction);
        command.Parameters.AddWithValue("clave", key);
        command.Parameters.AddWithValue("fecha_actualizacion_utc", DateTime.UtcNow);

        object? result = await command.ExecuteScalarAsync(cancellationToken);

        return Convert.ToInt32(result, CultureInfo.InvariantCulture);
    }

    private async Task<CodeSegments> ResolveCodeSegmentsAsync(
        string tipoEquipo,
        string dependencia,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(tipoEquipo))
            throw new ArgumentException("Seleccione el tipo de equipo.");

        if (string.IsNullOrWhiteSpace(dependencia))
            throw new ArgumentException("Seleccione la dependencia.");

        string requestedDependency = NormalizeLookup(dependencia);
        var activeDependencies = await _dbContext.Dependencias
            .AsNoTracking()
            .Where(item => item.Activa)
            .Select(item => new { item.Nombre, item.Codigo })
            .ToListAsync(cancellationToken);
        var dependency = activeDependencies.FirstOrDefault(item =>
            NormalizeLookup(item.Nombre) == requestedDependency ||
            NormalizeLookup(item.Codigo) == requestedDependency);

        if (dependency is null)
        {
            throw new ArgumentException(
                "La dependencia seleccionada no existe o está inactiva. Actualice el catálogo e inténtelo de nuevo.");
        }

        string typePrefix = GetTypePrefix(tipoEquipo);
        string dependencyCode = SanitizeSegment(dependency.Codigo, 8);

        if (string.IsNullOrWhiteSpace(dependencyCode))
            throw new ArgumentException("La dependencia no tiene un código válido configurado.");

        return new CodeSegments(
            typePrefix,
            dependencyCode,
            $"{typePrefix}-ALC-{dependencyCode}");
    }

    private static string GetTypePrefix(string tipoEquipo)
    {
        return NormalizeLookup(tipoEquipo).ToUpperInvariant() switch
        {
            "COMPUTADOR DE ESCRITORIO" => "PC",
            "PORTATIL" => "PT",
            "SERVIDOR" => "SRV",
            "MONITOR" => "MON",
            "SWITCH" => "SW",
            "ROUTER" => "RTR",
            "ACCESS POINT" => "AP",
            "UPS" => "UPS",
            "OTRO" => "EQ",
            _ => "EQ"
        };
    }

    private static string FormatCode(CodeSegments segments, int number) =>
        $"{segments.TypePrefix}-ALC-{segments.DependencyCode}-{number:D3}";

    private static string SanitizeSegment(string value, int maxLength)
    {
        string sanitized = new(
            NormalizeLookup(value)
                .ToUpperInvariant()
                .Where(char.IsLetterOrDigit)
                .Take(maxLength)
                .ToArray());

        return sanitized;
    }

    private static string NormalizeLookup(string value)
    {
        string normalized = (value ?? string.Empty)
            .Trim()
            .Normalize(NormalizationForm.FormD);
        var result = new StringBuilder(normalized.Length);

        foreach (char character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                result.Append(char.ToUpperInvariant(character));
        }

        return string.Join(
            ' ',
            result
                .ToString()
                .Normalize(NormalizationForm.FormC)
                .Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }

    private sealed record CodeSegments(
        string TypePrefix,
        string DependencyCode,
        string Key);

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
