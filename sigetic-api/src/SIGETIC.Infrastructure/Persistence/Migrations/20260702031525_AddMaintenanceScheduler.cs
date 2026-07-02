using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceScheduler : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "programaciones_mantenimiento",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_activo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    equipo_id = table.Column<Guid>(type: "uuid", nullable: true),
                    impresora_id = table.Column<Guid>(type: "uuid", nullable: true),
                    codigo_activo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    nombre_activo = table.Column<string>(type: "character varying(220)", maxLength: 220, nullable: false),
                    tipo_mantenimiento = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    fecha_programada = table.Column<DateOnly>(type: "date", nullable: false),
                    hora_programada = table.Column<TimeOnly>(type: "time without time zone", nullable: true),
                    frecuencia = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    estado = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    tecnico_responsable = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    correo_tecnico = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    ultima_notificacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_programaciones_mantenimiento", x => x.id);
                    table.ForeignKey(
                        name: "FK_programaciones_mantenimiento_equipos_equipo_id",
                        column: x => x.equipo_id,
                        principalTable: "equipos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_programaciones_mantenimiento_impresoras_impresora_id",
                        column: x => x.impresora_id,
                        principalTable: "impresoras",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_correo_tecnico",
                table: "programaciones_mantenimiento",
                column: "correo_tecnico");

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_equipo_id",
                table: "programaciones_mantenimiento",
                column: "equipo_id");

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_estado",
                table: "programaciones_mantenimiento",
                column: "estado");

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_fecha_programada",
                table: "programaciones_mantenimiento",
                column: "fecha_programada");

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_impresora_id",
                table: "programaciones_mantenimiento",
                column: "impresora_id");

            migrationBuilder.CreateIndex(
                name: "IX_programaciones_mantenimiento_tipo_activo",
                table: "programaciones_mantenimiento",
                column: "tipo_activo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "programaciones_mantenimiento");
        }
    }
}
