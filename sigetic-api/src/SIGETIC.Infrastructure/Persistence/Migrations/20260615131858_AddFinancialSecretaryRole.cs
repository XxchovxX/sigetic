using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialSecretaryRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "activo", "descripcion", "es_sistema", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre" },
                values: new object[] { new Guid("77777777-7777-7777-7777-777777777777"), true, "Acceso directivo de consulta, reportes, analitica, tickets y actualizacion de consumibles.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Secretario Administrativo Financiero" });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                column: "rol_id",
                value: new Guid("77777777-7777-7777-7777-777777777777"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"));

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                column: "rol_id",
                value: new Guid("22222222-2222-2222-2222-222222222222"));
        }
    }
}
