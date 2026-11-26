using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using SIGETIC.Api.Firmas;

namespace SIGETIC.Api.Endpoints;

public static class DocumentosFirmaEndpoints
{
    private const string Limite = "documentos-firma";

    public static void AddDocumentosFirma(this IServiceCollection services)
    {
        services.AddScoped<DocumentosFirmaService>();
        services.AddScoped<CorreoFirma>();
        services.AddHttpClient("FirmasCorreo", client => client.Timeout = TimeSpan.FromSeconds(15))
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false });
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(Limite, context => RateLimitPartition.GetFixedWindowLimiter(
                context.User.FindFirstValue("usuario_id") ?? "anónimo",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 12,
                    Window = TimeSpan.FromMinutes(10),
                    QueueLimit = 0
                }));
        });
    }

    public static void MapDocumentosFirma(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/documentos-firma")
            .WithTags("Documentos para firmar")
            .RequireAuthorization(policy => policy.RequireClaim("perfil_completo", "true"));

        group.AddEndpointFilter(async (invocation, next) =>
        {
            invocation.HttpContext.Response.Headers.CacheControl = "no-store";
            try
            {
                return await next(invocation);
            }
            catch (ErrorFirma error)
            {
                return Results.Json(new { message = error.Message }, statusCode: error.Status);
            }
        });

        group.MapGet("/", async (ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.ListarAsync(UsuarioId(user), ct)));
        group.MapGet("/plantilla", () => Results.Ok(PlantillaTh122.Secciones));
        group.MapGet("/{id:guid}", async (Guid id, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.DetalleAsync(UsuarioId(user), id, ct)));
        group.MapPost("/", async (CrearDocumentoFirma request, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.CrearAsync(UsuarioId(user), request, ct)))
            .RequireRateLimiting(Limite)
            .WithMetadata(new Microsoft.AspNetCore.Mvc.RequestSizeLimitAttribute(6_000_000));
        group.MapGet("/{id:guid}/pdf", async (Guid id, bool? final, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.File(await service.PdfAsync(UsuarioId(user), id, final == true, ct),
                "application/pdf", $"SIGETIC-{id:N}{(final == true ? "-firmado" : "")}.pdf"));
        group.MapPost("/{id:guid}/codigo", async (Guid id, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.EnviarCodigoAsync(UsuarioId(user), id, ct)))
            .RequireRateLimiting(Limite);
        group.MapPost("/{id:guid}/firmar", async (Guid id, ConfirmarFirma request, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.FirmarAsync(UsuarioId(user), id, request, ct)))
            .RequireRateLimiting(Limite);
        group.MapPost("/{id:guid}/cancelar", async (Guid id, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
            Results.Ok(await service.CancelarAsync(UsuarioId(user), id, ct)));
        group.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal user, DocumentosFirmaService service, CancellationToken ct) =>
        {
            await service.EliminarAsync(UsuarioId(user), id, ct);
            return Results.NoContent();
        }).RequireAuthorization(policy => policy.RequireRole("Administrador"));
    }

    private static Guid UsuarioId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue("usuario_id"), out var id)
            ? id
            : throw new ErrorFirma(401, "La sesión no identifica al usuario.");
}
