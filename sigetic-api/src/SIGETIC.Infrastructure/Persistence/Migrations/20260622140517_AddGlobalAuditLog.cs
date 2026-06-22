using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGlobalAuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "auditoria_registros",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    modulo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    accion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    entidad = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    registro_id = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    usuario = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    rol = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    metodo_http = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ruta = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    direccion_ip = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    resumen = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    fecha_evento_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auditoria_registros", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_registros_accion",
                table: "auditoria_registros",
                column: "accion");

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_registros_fecha_evento_utc",
                table: "auditoria_registros",
                column: "fecha_evento_utc");

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_registros_modulo",
                table: "auditoria_registros",
                column: "modulo");

            migrationBuilder.CreateIndex(
                name: "IX_auditoria_registros_usuario",
                table: "auditoria_registros",
                column: "usuario");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auditoria_registros");
        }
    }
}
