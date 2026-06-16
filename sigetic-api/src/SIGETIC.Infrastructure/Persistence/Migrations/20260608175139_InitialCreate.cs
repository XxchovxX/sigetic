using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "equipos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_interno = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    tipo_equipo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    marca = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    modelo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    serial = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    dependencia = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    funcionario_asignado = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    estado = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    procesador = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    memoria_ram = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    almacenamiento = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    sistema_operativo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    direccion_ip = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    direccion_mac = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ubicacion_fisica = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    fecha_ingreso = table.Column<DateOnly>(type: "date", nullable: false),
                    observaciones = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_equipos", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_equipos_codigo_interno",
                table: "equipos",
                column: "codigo_interno",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_equipos_serial",
                table: "equipos",
                column: "serial",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "equipos");
        }
    }
}
