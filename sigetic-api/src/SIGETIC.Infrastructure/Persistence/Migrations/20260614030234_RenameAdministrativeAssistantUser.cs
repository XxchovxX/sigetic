using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameAdministrativeAssistantUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "activo", "descripcion", "es_sistema", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre" },
                values: new object[] { new Guid("66666666-6666-6666-6666-666666666666"), true, "Apoyo administrativo de la Secretaria Administrativa Financiera para consumibles, reportes y trazabilidad.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Auxiliar Administrativo SAF" });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                columns: new[] { "correo", "nombre_completo", "rol_id" },
                values: new object[] { "auxiliar.administrativo@sigetic.local", "Auxiliar Administrativo - Secretaria Administrativa Financiera", new Guid("66666666-6666-6666-6666-666666666666") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"));

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                columns: new[] { "correo", "nombre_completo", "rol_id" },
                values: new object[] { "almacen@sigetic.local", "Auxiliar de Almacen TIC", new Guid("33333333-3333-3333-3333-333333333333") });
        }
    }
}
