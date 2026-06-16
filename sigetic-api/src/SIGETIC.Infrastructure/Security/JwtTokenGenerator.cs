using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SIGETIC.Application.Auth;

namespace SIGETIC.Infrastructure.Security;

public sealed class JwtTokenGenerator
{
    private readonly JwtOptions _options;

    public JwtTokenGenerator(IConfiguration configuration)
    {
        _options = configuration
            .GetSection("Jwt")
            .Get<JwtOptions>() ?? new JwtOptions();

        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            throw new InvalidOperationException(
                "La configuración JWT no tiene SecretKey.");
        }
    }

    public (string Token, DateTime ExpiraEnUtc) GenerateToken(
        AuthUserResponse user)
    {
        DateTime expires = DateTime.UtcNow.AddMinutes(_options.ExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Correo),
            new(JwtRegisteredClaimNames.Name, user.NombreCompleto),
            new("usuario_id", user.Id.ToString()),
            new("rol_id", user.RolId.ToString()),
            new(ClaimTypes.Role, user.Rol)
        };

        foreach (string permiso in user.Permisos)
        {
            claims.Add(new Claim("permiso", permiso));
        }

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_options.SecretKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        string tokenValue = new JwtSecurityTokenHandler()
            .WriteToken(token);

        return (tokenValue, expires);
    }
}