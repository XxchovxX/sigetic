using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOfficeSecretaryRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "activo", "descripcion", "es_sistema", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre" },
                values: new object[] { new Guid("88888888-8888-8888-8888-888888888888"), true, "Acceso para visualizar dashboard y crear solicitudes en mesa de ayuda.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Secretario de Despacho" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"));
        }
    }
}
