using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBajasEquipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bajas_equipo",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    equipo_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha_baja = table.Column<DateOnly>(type: "date", nullable: false),
                    motivo_baja = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: false),
                    responsable_baja = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    estado_fisico = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    disposicion_final = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bajas_equipo", x => x.id);
                    table.ForeignKey(
                        name: "FK_bajas_equipo_equipos_equipo_id",
                        column: x => x.equipo_id,
                        principalTable: "equipos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bajas_equipo_equipo_id",
                table: "bajas_equipo",
                column: "equipo_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_bajas_equipo_fecha_baja",
                table: "bajas_equipo",
                column: "fecha_baja");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bajas_equipo");
        }
    }
}
