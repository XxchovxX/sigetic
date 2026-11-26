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
    private readonly string gmailClaveAplicacion = string.Concat(
        (configuration["Firmas:GmailClaveAplicacion"] ?? "").Where(c => !char.IsWhiteSpace(c)));

    public bool Configurado => MailAddress.TryCreate(remitente, out var desde) && proveedor switch
    {
        "gmail" => (desde.Host.Equals("gmail.com", StringComparison.OrdinalIgnoreCase) ||
            desde.Host.Equals("googlemail.com", StringComparison.OrdinalIgnoreCase)) &&
            gmailClaveAplicacion.Length == 16 && gmailClaveAplicacion.All(char.IsAsciiLetterOrDigit),
        "resend" => !string.IsNullOrWhiteSpace(resendApiKey),
        _ => false
    };

    public async Task EnviarAsync(MailAddress destinatario, string codigo, Guid documentoId, CancellationToken ct)
    {
        var cuerpo = $"Tu código es {codigo}. Vence en 10 minutos y solo sirve para el documento {documentoId:N}.\n\n" +
            "Ingresa el código únicamente en SIGETIC para confirmar tu firma. Si no solicitaste el código, ignora este correo.";
        if (proveedor == "gmail")
        {
            var desde = new MailAddress(new MailAddress(remitente!).Address, "SIGETIC");
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
                Credentials = new NetworkCredential(desde.Address, gmailClaveAplicacion)
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
