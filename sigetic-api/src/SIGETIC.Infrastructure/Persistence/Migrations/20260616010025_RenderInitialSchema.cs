using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenderInitialSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "descripcion",
                value: "Apoyo administrativo de la Secretaría Administrativa Financiera para consumibles, reportes y trazabilidad.");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "descripcion",
                value: "Acceso directivo de consulta, reportes, analítica, tickets y actualización de consumibles.");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                column: "nombre_completo",
                value: "Auxiliar Administrativo - Secretaría Administrativa Financiera");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"),
                column: "descripcion",
                value: "Apoyo administrativo de la Secretaria Administrativa Financiera para consumibles, reportes y trazabilidad.");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"),
                column: "descripcion",
                value: "Acceso directivo de consulta, reportes, analitica, tickets y actualizacion de consumibles.");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                column: "nombre_completo",
                value: "Auxiliar Administrativo - Secretaria Administrativa Financiera");
        }
    }
}
