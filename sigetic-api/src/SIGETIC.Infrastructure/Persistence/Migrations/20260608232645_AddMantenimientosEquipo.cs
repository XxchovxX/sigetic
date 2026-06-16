using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMantenimientosEquipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "mantenimientos_equipo",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipo_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_mantenimiento = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    fecha_mantenimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    tecnico_responsable = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    diagnostico = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: false),
                    actividades_realizadas = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    repuestos_utilizados = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    estado_resultante = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    proxima_revision = table.Column<DateOnly>(type: "date", nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mantenimientos_equipo", x => x.id);
                    table.ForeignKey(
                        name: "FK_mantenimientos_equipo_equipos_equipo_id",
                        column: x => x.equipo_id,
                        principalTable: "equipos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_mantenimientos_equipo_equipo_id",
                table: "mantenimientos_equipo",
                column: "equipo_id");

            migrationBuilder.CreateIndex(
                name: "IX_mantenimientos_equipo_fecha_mantenimiento",
                table: "mantenimientos_equipo",
                column: "fecha_mantenimiento");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "mantenimientos_equipo");
        }
    }
}
