using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOperationalUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "usuarios",
                columns: new[] { "id", "activo", "correo", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre_completo", "password_hash", "rol_id", "ultimo_acceso_utc" },
                values: new object[,]
                {
                    { new Guid("99999999-9999-9999-9999-999999999901"), true, "coordinador@sigetic.local", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Coordinador TIC", "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=", new Guid("22222222-2222-2222-2222-222222222222"), null },
                    { new Guid("99999999-9999-9999-9999-999999999902"), true, "tecnico@sigetic.local", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tecnico de Mantenimientos", "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=", new Guid("33333333-3333-3333-3333-333333333333"), null },
                    { new Guid("99999999-9999-9999-9999-999999999903"), true, "almacen@sigetic.local", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Auxiliar de Almacen TIC", "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$CcD5E2RqWu4gVWIrvU4M+JPC/m9tMGOmLLZLcf8aHRc=", new Guid("33333333-3333-3333-3333-333333333333"), null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"));

            migrationBuilder.DeleteData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"));

            migrationBuilder.DeleteData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"));
        }
    }
}
