using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SIGETIC.Api.Endpoints;
using SIGETIC.Infrastructure;
using SIGETIC.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

var configuredCorsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("SigeticWeb", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
                configuredCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase) ||
                IsAllowedWebOrigin(origin))
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddInfrastructure(builder.Configuration);

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];

if (string.IsNullOrWhiteSpace(jwtSecretKey))
{
    throw new InvalidOperationException("La configuración JWT no tiene SecretKey.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
    });

builder.Services.AddAuthorization(options =>
{
    string[] admin = ["Administrador"];
    string[] technicalRead =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas",
        "Secretario Administrativo Financiero",
        "Consulta / Control Interno"
    ];
    string[] technicalWrite =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas"
    ];
    string[] consumibles =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas",
        "Secretario Administrativo Financiero",
        "Auxiliar Administrativo SAF"
    ];
    string[] dashboard =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas",
        "Secretario Administrativo Financiero",
        "Secretario de Despacho",
        "Consulta / Control Interno"
    ];
    string[] reports =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas",
        "Secretario Administrativo Financiero",
        "Consulta / Control Interno"
    ];
    string[] tickets =
    [
        "Administrador",
        "Administrador TIC",
        "Auxiliar de Sistemas",
        "Secretario Administrativo Financiero",
        "Auxiliar Administrativo SAF",
        "Funcionario",
        "Secretario de Despacho",
        "Consulta / Control Interno"
    ];

    options.AddPolicy("Administracion", policy => policy.RequireRole(admin));
    options.AddPolicy("TecnicoLectura", policy => policy.RequireRole(technicalRead));
    options.AddPolicy("TecnicoEscritura", policy => policy.RequireRole(technicalWrite));
    options.AddPolicy("Consumibles", policy => policy.RequireRole(consumibles));
    options.AddPolicy("Dashboard", policy => policy.RequireRole(dashboard));
    options.AddPolicy("ReportesAnalitica", policy => policy.RequireRole(reports));
    options.AddPolicy("MesaAyuda", policy => policy.RequireRole(tickets));
});

var app = builder.Build();

await ApplyDatabaseMigrationsAsync(app);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("SigeticWeb");

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        application = "SIGETIC API",
        status = "Running",
        endpoints = new[]
        {
            "/api/health",
            "/api/auth/login",
            "/api/auth/me",
            "/api/equipos",
            "/api/equipos/{id}",
            "/api/administracion/roles",
            "/api/administracion/usuarios",
            "/api/administracion/dependencias",
            "/api/administracion/funcionarios",
            "/api/impresoras",
            "/api/consumibles",
            "/api/tickets",
            "/api/analitica",
            "/api/dashboard/resumen"
        },
        timestampUtc = DateTime.UtcNow
    });
});

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "OK",
        application = "SIGETIC API",
        timestampUtc = DateTime.UtcNow
    });
});

app.MapEquipoEndpoints();
app.MapAdministracionEndpoints();
app.MapAuthEndpoints();
app.MapImpresoraEndpoints();
app.MapConsumibleEndpoints();
app.MapTicketEndpoints();
app.MapAnaliticaEndpoints();
app.MapDashboardEndpoints();

app.Run();

static bool IsAllowedWebOrigin(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    if (uri.Scheme is not ("http" or "https"))
    {
        return false;
    }

    if (uri.Port != 3000)
    {
        return false;
    }

    if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase) ||
        uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    return IsPrivateNetworkHost(uri.Host);
}

static bool IsPrivateNetworkHost(string host)
{
    if (!System.Net.IPAddress.TryParse(host, out var address))
    {
        return true;
    }

    var bytes = address.GetAddressBytes();

    return bytes.Length == 4 &&
        (bytes[0] == 10 ||
         (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) ||
         (bytes[0] == 192 && bytes[1] == 168));
}

static async Task ApplyDatabaseMigrationsAsync(WebApplication app)
{
    if (!app.Configuration.GetValue("Database:ApplyMigrationsOnStartup", false))
    {
        return;
    }

    const int maxAttempts = 10;

    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<SigeticDbContext>();
    var logger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseMigration");

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully.");
            return;
        }
        catch (Exception exception) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                exception,
                "Database migration attempt {Attempt} of {MaxAttempts} failed. Retrying...",
                attempt,
                maxAttempts);

            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }

    await dbContext.Database.MigrateAsync();
}
