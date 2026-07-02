using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTecnicoTicRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "activo", "descripcion", "es_sistema", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre" },
                values: new object[] { new Guid("99999999-9999-9999-9999-999999999910"), true, "Ejecucion operativa de soportes, mantenimientos, inventario TIC, impresoras, consumibles y programaciones preventivas.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tecnico TIC" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999910"));
        }
    }
}
