using System.Data.Common;
using System.Globalization;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Persistence;

namespace SIGETIC.Api.Firmas;

internal sealed record CrearDocumentoFirma(string? Titulo, string? CorreoRecibe, Dictionary<string, string[][]>? Campos,
    string? PdfBase64, string? CorreoFirmaPrincipal);
internal sealed record ConfirmarFirma(string? Codigo, string? Sha256, bool Acepta);
internal sealed record FirmaRegistrada(string Nombre, string? Cargo, string Correo, DateTimeOffset FechaUtc, string Acuerdo);
internal sealed record RetoFirma(Guid Id, string Correo, string Mac, DateTimeOffset SolicitadoUtc, bool Enviado, int Intentos);
internal sealed record FirmanteDocumento(Guid Id, string Nombre, string? Cargo, string Rol, RetoFirma? Reto = null, FirmaRegistrada? Firma = null);
internal sealed record DatosDocumento(string Titulo, string Tipo, string Sha256, FirmanteDocumento[] Firmantes, DateTimeOffset? CanceladoUtc = null, string? Sha256Final = null);
internal sealed record DocumentoFirma(Guid Id, Guid Creador, DateTimeOffset CreadoUtc, int Revision, DatosDocumento Datos, byte[]? Original, byte[]? Final);
internal sealed class ErrorFirma(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

internal sealed class DocumentosFirmaService(
    SigeticDbContext db, IConfiguration configuration, IHttpClientFactory clients, ILogger<DocumentosFirmaService> logger)
{
    private const int MaxPdf = 4 * 1024 * 1024;
    private const string Acuerdo = "Acepto usar la firma electrónica de SIGETIC y manifiesto mi aprobación del contenido de la versión del documento identificada por la huella SHA-256.";
    private static readonly TimeSpan Vigencia = TimeSpan.FromMinutes(10);
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<object[]> ListarAsync(Guid usuarioId, CancellationToken ct)
    {
        await UsuarioAsync(usuarioId, ct);
        var documentos = new List<object>();
        await using var cmd = await ComandoAsync("""
            SELECT id, creador_id, creado_utc, revision, datos::text
            FROM documentos_firma WHERE creador_id = @usuario OR firmantes @> ARRAY[@usuario]
            ORDER BY creado_utc DESC, id LIMIT 100
            """, ct, ("usuario", usuarioId));
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            documentos.Add(Respuesta(Leer(reader, false), usuarioId));
        return documentos.ToArray();
    }

    public async Task<object> CrearAsync(Guid usuarioId, CrearDocumentoFirma request, CancellationToken ct)
    {
        var usuario = await UsuarioAsync(usuarioId, ct);
        var esFormato = request.Campos is not null;
        if (esFormato == (request.PdfBase64 is not null))
            throw new ErrorFirma(400, "Diligencia el TH-F-122 o carga un PDF.");

        var principal = !esFormato && !string.IsNullOrWhiteSpace(request.CorreoFirmaPrincipal)
            ? await FirmantePorCorreoAsync(request.CorreoFirmaPrincipal, ct)
            : usuario;
        var firmantes = new List<FirmanteDocumento>
        {
            new(principal.Id, principal.NombreCompleto, principal.Cargo, esFormato ? "Entrega el conocimiento" : "Firma principal")
        };
        Usuario? recibe = null;
        if (esFormato || !string.IsNullOrWhiteSpace(request.CorreoRecibe))
        {
            recibe = await FirmantePorCorreoAsync(request.CorreoRecibe, ct);
            if (recibe.Id == principal.Id)
                throw new ErrorFirma(400, "Asigna una cuenta distinta de SIGETIC a cada espacio de firma.");
            firmantes.Add(new(recibe.Id, recibe.NombreCompleto, recibe.Cargo, esFormato ? "Recibe el conocimiento" : "Segunda firma"));
        }

        var id = Guid.NewGuid();
        var creado = DateTimeOffset.UtcNow;
        var titulo = esFormato ? PlantillaTh122.Titulo : request.Titulo?.Trim();
        if (string.IsNullOrWhiteSpace(titulo) || titulo.Length > 180 || titulo.Any(char.IsControl))
            throw new ErrorFirma(400, "Indica un título de hasta 180 caracteres.");
        if (!MailAddress.TryCreate(principal.Correo, out _))
            throw new ErrorFirma(409, "Tu cuenta necesita un correo válido para firmar.");

        var pdf = esFormato
            ? PdfFirma.CrearFormato(id, PlantillaTh122.Normalizar(request.Campos!, usuario, recibe!), firmantes, creado)
            : PdfFirma.Importar(DecodificarPdf(request.PdfBase64!));
        var datos = new DatosDocumento(titulo, esFormato ? "TH-F-122" : "PDF", Hash(pdf), firmantes.ToArray());
        var documento = new DocumentoFirma(id, usuarioId, creado, 0, datos, pdf, null);
        await using var cmd = await ComandoAsync("""
            INSERT INTO documentos_firma (id, creador_id, firmantes, creado_utc, datos, pdf_original)
            VALUES (@id, @creador, @firmantes, @creado, CAST(@datos AS jsonb), @pdf)
            """, ct, ("id", id), ("creador", usuarioId), ("firmantes", firmantes.Select(f => f.Id).ToArray()),
            ("creado", creado), ("datos", JsonSerializer.Serialize(datos, Json)), ("pdf", pdf));
        await cmd.ExecuteNonQueryAsync(ct);
        return Respuesta(documento, usuarioId);
    }

    public async Task<byte[]> PdfAsync(Guid usuarioId, Guid id, bool final, CancellationToken ct)
    {
        await UsuarioAsync(usuarioId, ct);
        var documento = await ObtenerAsync(usuarioId, id, ct, incluirPdf: true);
        var pdf = final ? documento.Final : documento.Original;
        var huella = final ? documento.Datos.Sha256Final : documento.Datos.Sha256;
        if (pdf is null)
            throw new ErrorFirma(409, "El PDF con constancia se genera cuando firman todas las personas asignadas.");
        if (Hash(pdf) != huella)
            throw new ErrorFirma(409, "La huella del PDF guardado no coincide con el registro.");
        return pdf;
    }

    public async Task<object> DetalleAsync(Guid usuarioId, Guid id, CancellationToken ct)
    {
        await UsuarioAsync(usuarioId, ct);
        return Respuesta(await ObtenerAsync(usuarioId, id, ct), usuarioId);
    }

    public async Task<object> EnviarCodigoAsync(Guid usuarioId, Guid id, CancellationToken ct)
    {
        var usuario = await UsuarioAsync(usuarioId, ct);
        var documento = await ObtenerAsync(usuarioId, id, ct);
        var firmante = Pendiente(documento, usuarioId);
        var ahora = DateTimeOffset.UtcNow;
        if (firmante.Reto is { } anterior && ahora < anterior.SolicitadoUtc.AddMinutes(1))
            throw new ErrorFirma(429, "Espera un minuto antes de solicitar otro código.");

        var apiKey = configuration["Firmas:ResendApiKey"];
        var remitente = configuration["Firmas:Remitente"];
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(remitente) ||
            !MailAddress.TryCreate(remitente, out _) || !MailAddress.TryCreate(usuario.Correo, out _))
            throw new ErrorFirma(503, "El correo de firma no está disponible. Comunícate con el administrador de SIGETIC.");

        var codigo = RandomNumberGenerator.GetInt32(1_000_000).ToString("D6", CultureInfo.InvariantCulture);
        var retoId = Guid.NewGuid();
        var reto = new RetoFirma(retoId, usuario.Correo, Mac(documento, usuario.Id, retoId, usuario.Correo, codigo), ahora, false, 0);
        await GuardarAsync(documento, CambiarFirmante(documento, firmante with { Reto = reto }), ct);
        try
        {
            using var envio = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
            envio.Headers.Authorization = new("Bearer", apiKey);
            envio.Content = JsonContent.Create(new
            {
                from = remitente,
                to = new[] { usuario.Correo },
                subject = "SIGETIC | Código para firmar un documento",
                text = $"Tu código es {codigo}. Vence en 10 minutos y solo sirve para el documento {id:N}.\n\n" +
                    "Ingresa el código únicamente en SIGETIC para confirmar tu firma. Si no solicitaste el código, ignora este correo."
            });
            using var cliente = clients.CreateClient("FirmasCorreo");
            using var respuesta = await cliente.SendAsync(envio, HttpCompletionOption.ResponseHeadersRead, ct);
            respuesta.EnsureSuccessStatusCode();
        }
        catch (Exception error) when (error is HttpRequestException || error is OperationCanceledException && !ct.IsCancellationRequested)
        {
            logger.LogWarning("No fue posible enviar el código de firma del documento {DocumentoId}.", id);
            throw new ErrorFirma(503, "El servicio de correo no pudo enviar el código. Vuelve a intentarlo en un minuto.");
        }

        await ActivarRetoAsync(usuarioId, id, reto.Id, ct);
        return new { correo = OcultarCorreo(usuario.Correo), venceUtc = ahora.Add(Vigencia) };
    }

    private async Task ActivarRetoAsync(Guid usuarioId, Guid id, Guid retoId, CancellationToken ct)
    {
        for (var intento = 0; ; intento++)
        {
            var documento = await ObtenerAsync(usuarioId, id, ct);
            var firmante = Pendiente(documento, usuarioId);
            if (firmante.Reto is not { } reto || reto.Id != retoId)
                throw new ErrorFirma(409, "Solicita un código nuevo. El reto de firma cambió.");
            try
            {
                await GuardarAsync(documento, CambiarFirmante(documento, firmante with { Reto = reto with { Enviado = true } }), ct);
                return;
            }
            catch (ErrorFirma error) when (error.Status == 409 && intento < 2)
            {
                // Otro firmante actualizó el mismo documento.
            }
        }
    }

    public async Task<object> FirmarAsync(Guid usuarioId, Guid id, ConfirmarFirma request, CancellationToken ct)
    {
        if (!request.Acepta || request.Codigo is not { Length: 6 } codigo || codigo.Any(c => c is < '0' or > '9'))
            throw new ErrorFirma(400, "Confirma tu aceptación e ingresa el código de seis dígitos.");

        var usuario = await UsuarioAsync(usuarioId, ct);
        var documento = await ObtenerAsync(usuarioId, id, ct, incluirPdf: true);
        var firmante = Pendiente(documento, usuarioId);
        if (request.Sha256 != documento.Datos.Sha256 || Hash(documento.Original!) != documento.Datos.Sha256)
            throw new ErrorFirma(409, "Vuelve a abrir el PDF para revisar la versión que vas a firmar.");
        var reto = firmante.Reto;
        var ahora = DateTimeOffset.UtcNow;
        if (reto is not { Enviado: true, Intentos: < 5 } || ahora >= reto.SolicitadoUtc.Add(Vigencia) || reto.Correo != usuario.Correo)
            throw new ErrorFirma(409, "Solicita un código nuevo para continuar.");

        var esperado = Mac(documento, usuarioId, reto.Id, reto.Correo, codigo);
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(reto.Mac), Convert.FromHexString(esperado)))
        {
            await GuardarAsync(documento, CambiarFirmante(documento, firmante with { Reto = reto with { Intentos = reto.Intentos + 1 } }), ct);
            throw new ErrorFirma(400, reto.Intentos == 4 ? "Se agotaron los intentos. Solicita otro código." : "El código es incorrecto.");
        }

        var firma = new FirmaRegistrada(usuario.NombreCompleto, usuario.Cargo, usuario.Correo, ahora, Acuerdo);
        var datos = CambiarFirmante(documento, firmante with { Firma = firma, Reto = null });
        byte[]? final = null;
        if (datos.Firmantes.All(f => f.Firma is not null))
        {
            final = PdfFirma.AgregarConstancia(documento.Original!, id, datos);
            datos = datos with { Sha256Final = Hash(final) };
        }

        return Respuesta(await GuardarAsync(documento, datos, ct, final), usuarioId);
    }

    public async Task<object> CancelarAsync(Guid usuarioId, Guid id, CancellationToken ct)
    {
        await UsuarioAsync(usuarioId, ct);
        var documento = await ObtenerAsync(usuarioId, id, ct);
        if (documento.Creador != usuarioId || documento.Datos.CanceladoUtc is not null ||
            documento.Datos.Firmantes.Any(f => f.Firma is not null))
            throw new ErrorFirma(409, "Solo el creador puede cancelar un documento que todavía no tiene firmas.");
        var datos = documento.Datos with
        {
            CanceladoUtc = DateTimeOffset.UtcNow,
            Firmantes = documento.Datos.Firmantes.Select(f => f with { Reto = null }).ToArray()
        };
        return Respuesta(await GuardarAsync(documento, datos, ct), usuarioId);
    }

    private async Task<Usuario> UsuarioAsync(Guid id, CancellationToken ct)
    {
        var usuario = await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.Id == id && u.Activo, ct);
        return usuario is { PerfilCompleto: true } ? usuario : throw new ErrorFirma(403, "Se requiere una cuenta activa con el perfil completo.");
    }

    private async Task<Usuario> FirmantePorCorreoAsync(string? entrada, CancellationToken ct)
    {
        var correo = entrada?.Trim().ToLowerInvariant();
        var usuario = correo is { Length: > 0 and <= 180 }
            ? await db.Usuarios.AsNoTracking().SingleOrDefaultAsync(u => u.Correo == correo && u.Activo, ct)
            : null;
        return usuario is { PerfilCompleto: true } && MailAddress.TryCreate(usuario.Correo, out _)
            ? usuario
            : throw new ErrorFirma(400, "Indica el correo registrado en SIGETIC de una cuenta activa con el perfil completo.");
    }

    private async Task<DocumentoFirma> ObtenerAsync(Guid usuarioId, Guid id, CancellationToken ct, bool incluirPdf = false)
    {
        var sql = incluirPdf
            ? "SELECT id, creador_id, creado_utc, revision, datos::text, pdf_original, pdf_final"
            : "SELECT id, creador_id, creado_utc, revision, datos::text";
        await using var cmd = await ComandoAsync(sql + """
             FROM documentos_firma WHERE id = @id AND (creador_id = @usuario OR firmantes @> ARRAY[@usuario])
            """, ct, ("id", id), ("usuario", usuarioId));
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct)
            ? Leer(reader, incluirPdf)
            : throw new ErrorFirma(404, "El documento no está disponible en tu bandeja.");
    }

    private async Task<DocumentoFirma> GuardarAsync(DocumentoFirma documento, DatosDocumento datos, CancellationToken ct, byte[]? final = null)
    {
        var parametros = new List<(string, object)>
        {
            ("datos", JsonSerializer.Serialize(datos, Json)), ("id", documento.Id), ("revision", documento.Revision)
        };
        var asignacion = "";
        if (final is not null)
        {
            parametros.Add(("final", final));
            asignacion = ", pdf_final = @final";
        }
        await using var cmd = await ComandoAsync(
            "UPDATE documentos_firma SET datos = CAST(@datos AS jsonb), revision = revision + 1" + asignacion +
            " WHERE id = @id AND revision = @revision", ct, parametros.ToArray());
        if (await cmd.ExecuteNonQueryAsync(ct) != 1)
            throw new ErrorFirma(409, "El documento cambió durante la operación. Actualiza la bandeja e inténtalo de nuevo.");
        return documento with { Revision = documento.Revision + 1, Datos = datos, Final = final };
    }

    private async Task<DbCommand> ComandoAsync(string sql, CancellationToken ct, params (string Nombre, object Valor)[] valores)
    {
        var conexion = db.Database.GetDbConnection();
        if (conexion.State != System.Data.ConnectionState.Open)
            await db.Database.OpenConnectionAsync(ct);
        var cmd = conexion.CreateCommand();
        cmd.CommandText = sql;
        foreach (var (nombre, valor) in valores)
        {
            var parametro = cmd.CreateParameter();
            parametro.ParameterName = nombre;
            parametro.Value = valor;
            cmd.Parameters.Add(parametro);
        }
        return cmd;
    }

    private static DocumentoFirma Leer(DbDataReader reader, bool incluirPdf) => new(
        reader.GetGuid(0), reader.GetGuid(1), reader.GetFieldValue<DateTimeOffset>(2), reader.GetInt32(3),
        JsonSerializer.Deserialize<DatosDocumento>(reader.GetString(4), Json)!,
        incluirPdf ? reader.GetFieldValue<byte[]>(5) : null,
        incluirPdf && !reader.IsDBNull(6) ? reader.GetFieldValue<byte[]>(6) : null);

    private static object Respuesta(DocumentoFirma doc, Guid usuario) => new
    {
        doc.Id, doc.CreadoUtc, doc.Datos.Tipo, doc.Datos.Titulo, doc.Datos.Sha256, doc.Datos.Sha256Final,
        doc.Datos.CanceladoUtc, acuerdo = Acuerdo,
        puedeCancelar = doc.Creador == usuario && doc.Datos.CanceladoUtc is null && doc.Datos.Firmantes.All(f => f.Firma is null),
        puedeFirmar = doc.Datos.CanceladoUtc is null && doc.Datos.Firmantes.Any(f => f.Id == usuario && f.Firma is null),
        firmantes = doc.Datos.Firmantes.Select(f => new { nombre = f.Firma?.Nombre ?? f.Nombre, cargo = f.Firma?.Cargo ?? f.Cargo, f.Rol, fechaUtc = f.Firma?.FechaUtc })
    };

    private static FirmanteDocumento Pendiente(DocumentoFirma doc, Guid usuario)
    {
        if (doc.Datos.CanceladoUtc is not null)
            throw new ErrorFirma(409, "El documento fue cancelado.");
        var firmante = doc.Datos.Firmantes.SingleOrDefault(f => f.Id == usuario);
        return firmante is { Firma: null } ? firmante : throw new ErrorFirma(409, "No tienes una firma pendiente en este documento.");
    }

    private static DatosDocumento CambiarFirmante(DocumentoFirma doc, FirmanteDocumento actualizado) =>
        doc.Datos with { Firmantes = doc.Datos.Firmantes.Select(f => f.Id == actualizado.Id ? actualizado : f).ToArray() };

    private string Mac(DocumentoFirma doc, Guid usuario, Guid reto, string correo, string codigo)
    {
        var jwtKey = Encoding.UTF8.GetBytes(configuration["Jwt:SecretKey"]!);
        var otpKey = HMACSHA256.HashData(jwtKey, "SIGETIC:documentos-firma:OTP:v1"u8);
        var mensaje = Encoding.UTF8.GetBytes($"{doc.Id:N}|{doc.Datos.Sha256}|{usuario:N}|{reto:N}|{correo}|{codigo}");
        return Convert.ToHexString(HMACSHA256.HashData(otpKey, mensaje));
    }

    private static string Hash(byte[] bytes) => Convert.ToHexStringLower(SHA256.HashData(bytes));

    private static byte[] DecodificarPdf(string texto)
    {
        if (texto.Length > (MaxPdf + 2) / 3 * 4)
            throw new ErrorFirma(400, "El PDF debe pesar máximo 4 MB.");
        try
        {
            var bytes = Convert.FromBase64String(texto);
            if (bytes.Length <= MaxPdf && bytes.AsSpan().StartsWith("%PDF-"u8))
                return bytes;
        }
        catch (FormatException)
        {
            // La entrada debe ser un PDF codificado en Base64.
        }
        throw new ErrorFirma(400, "Selecciona un PDF válido de hasta 4 MB.");
    }

    private static string OcultarCorreo(string correo)
    {
        var indice = correo.LastIndexOf('@');
        return indice > 0 ? $"{correo[0]}•••{correo[indice..]}" : "correo registrado";
    }
}
