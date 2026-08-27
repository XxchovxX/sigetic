using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAutomaticEquipmentCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "secuencias_codigo_equipo",
                columns: table => new
                {
                    clave = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ultimo_numero = table.Column<int>(type: "integer", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_secuencias_codigo_equipo", x => x.clave);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "secuencias_codigo_equipo");
        }
    }
}
