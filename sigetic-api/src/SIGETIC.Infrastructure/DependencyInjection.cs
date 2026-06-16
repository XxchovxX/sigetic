using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using SIGETIC.Application.Administracion;
using SIGETIC.Application.Auth;
using SIGETIC.Application.Equipos;
using SIGETIC.Infrastructure.Persistence;
using SIGETIC.Infrastructure.Security;
using SIGETIC.Infrastructure.Services;
using SIGETIC.Application.Impresoras;
using SIGETIC.Application.Consumibles;
using SIGETIC.Application.Dashboard;
using SIGETIC.Application.Tickets;
using SIGETIC.Application.Analitica;

namespace SIGETIC.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddDbContext<SigeticDbContext>(options =>
        {
            options.UseNpgsql(GetDatabaseConnectionString(configuration));
        });

        services.AddScoped<IEquipoService, EquipoService>();
        services.AddScoped<IMantenimientoEquipoService, MantenimientoEquipoService>();
        services.AddScoped<IBajaEquipoService, BajaEquipoService>();
        services.AddScoped<IAdministracionService, AdministracionService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddSingleton<JwtTokenGenerator>();
        services.AddScoped<IImpresoraService, ImpresoraService>();
        services.AddScoped<IConsumibleService, ConsumibleService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IEmailNotificationService, EmailNotificationService>();
        services.AddScoped<ITicketService, TicketService>();
        services.AddScoped<IAnaliticaService, AnaliticaService>();

        return services;
    }

    private static string GetDatabaseConnectionString(IConfiguration configuration)
    {
        var configuredConnectionString = configuration.GetConnectionString("SigeticDatabase");

        if (!string.IsNullOrWhiteSpace(configuredConnectionString))
        {
            return configuredConnectionString;
        }

        var databaseUrl = configuration["DATABASE_URL"];

        if (string.IsNullOrWhiteSpace(databaseUrl))
        {
            throw new InvalidOperationException("No se encontro cadena de conexion para PostgreSQL.");
        }

        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);

        if (userInfo.Length != 2)
        {
            throw new InvalidOperationException("DATABASE_URL no contiene usuario y contrasena validos.");
        }

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = Uri.UnescapeDataString(userInfo[1]),
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }
}
