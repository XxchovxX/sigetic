using System.Net;
using System.Net.Mail;
using System.Text;

namespace SIGETIC.Api.Firmas;

internal sealed class CorreoFirma(IConfiguration configuration, IHttpClientFactory clients)
{
    private const string Asunto = "SIGETIC | Código para firmar un documento";

    private readonly string proveedor = configuration["Firmas:ProveedorCorreo"]?.Trim().ToLowerInvariant() ?? "resend";
    private readonly string? remitente = configuration["Firmas:Remitente"]?.Trim();
    private readonly string? resendApiKey = configuration["Firmas:ResendApiKey"]?.Trim();
    private readonly (MailAddress Direccion, string Clave)? gmail = LeerGmail(configuration);

    public bool Configurado => proveedor switch
    {
        "gmail" => gmail is not null,
        "resend" => MailAddress.TryCreate(remitente, out _) && !string.IsNullOrWhiteSpace(resendApiKey),
        _ => false
    };

    private static (MailAddress Direccion, string Clave)? LeerGmail(IConfiguration configuration)
    {
        var direccion = configuration["Firmas:Remitente"];
        var clave = configuration["Firmas:GmailClaveAplicacion"];
        if (string.IsNullOrWhiteSpace(direccion) && string.IsNullOrWhiteSpace(clave))
        {
            if (!string.Equals(configuration["Email:SmtpHost"]?.Trim(), "smtp.gmail.com", StringComparison.OrdinalIgnoreCase))
                return null;

            direccion = configuration["Email:SmtpUser"];
            clave = configuration["Email:SmtpPassword"];
        }

        var normalizada = string.Concat((clave ?? "").Where(c => !char.IsWhiteSpace(c)));
        if (!MailAddress.TryCreate(direccion?.Trim(), out var cuenta) ||
            !(cuenta.Host.Equals("gmail.com", StringComparison.OrdinalIgnoreCase) ||
              cuenta.Host.Equals("googlemail.com", StringComparison.OrdinalIgnoreCase)) ||
            normalizada.Length != 16 || !normalizada.All(char.IsAsciiLetterOrDigit))
            return null;

        return (new MailAddress(cuenta.Address, "SIGETIC"), normalizada);
    }

    public async Task EnviarAsync(MailAddress destinatario, string codigo, Guid documentoId, CancellationToken ct)
    {
        var cuerpo = $"Tu código es {codigo}. Vence en 10 minutos y solo sirve para el documento {documentoId:N}.\n\n" +
            "Ingresa el código únicamente en SIGETIC para confirmar tu firma. Si no solicitaste el código, ignora este correo.";
        if (proveedor == "gmail")
        {
            var (desde, clave) = gmail ?? throw new InvalidOperationException("Gmail no está configurado para firmas.");
            using var correo = new MailMessage(desde, destinatario)
            {
                Subject = Asunto,
                SubjectEncoding = Encoding.UTF8,
                Body = cuerpo,
                BodyEncoding = Encoding.UTF8
            };
            using var smtp = new SmtpClient("smtp.gmail.com", 587)
            {
                EnableSsl = true,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(desde.Address, clave)
            };
            using var plazo = CancellationTokenSource.CreateLinkedTokenSource(ct);
            plazo.CancelAfter(TimeSpan.FromSeconds(15));
            await smtp.SendMailAsync(correo, plazo.Token);
            return;
        }

        using var envio = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        envio.Headers.Authorization = new("Bearer", resendApiKey);
        envio.Content = JsonContent.Create(new { from = remitente, to = new[] { destinatario.Address }, subject = Asunto, text = cuerpo });
        using var cliente = clients.CreateClient("FirmasCorreo");
        using var respuesta = await cliente.SendAsync(envio, HttpCompletionOption.ResponseHeadersRead, ct);
        respuesta.EnsureSuccessStatusCode();
    }
}
