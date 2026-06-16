using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddHelpdeskAndRenameTicRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tickets_mesa_ayuda",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    fecha_solicitud = table.Column<DateOnly>(type: "date", nullable: false),
                    solicitante = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    dependencia = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    categoria = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    prioridad = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    estado = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    responsable_asignado = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    equipo_codigo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    impresora_codigo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    fecha_compromiso = table.Column<DateOnly>(type: "date", nullable: true),
                    solucion = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tickets_mesa_ayuda", x => x.id);
                });

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "nombre",
                value: "Administrador TIC");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                columns: new[] { "correo", "nombre_completo" },
                values: new object[] { "secretario.administrativo@sigetic.local", "Secretario Administrativo Financiero" });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                columns: new[] { "correo", "nombre_completo", "rol_id" },
                values: new object[] { "administrador.tic@sigetic.local", "Administrador TIC", new Guid("22222222-2222-2222-2222-222222222222") });

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_codigo",
                table: "tickets_mesa_ayuda",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_estado",
                table: "tickets_mesa_ayuda",
                column: "estado");

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_fecha_solicitud",
                table: "tickets_mesa_ayuda",
                column: "fecha_solicitud");

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_prioridad",
                table: "tickets_mesa_ayuda",
                column: "prioridad");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tickets_mesa_ayuda");

            migrationBuilder.UpdateData(
                table: "roles",
                keyColumn: "id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"),
                column: "nombre",
                value: "Ingeniero TIC");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                columns: new[] { "correo", "nombre_completo" },
                values: new object[] { "coordinador@sigetic.local", "Coordinador TIC" });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                columns: new[] { "correo", "nombre_completo", "rol_id" },
                values: new object[] { "tecnico@sigetic.local", "Tecnico de Mantenimientos", new Guid("33333333-3333-3333-3333-333333333333") });
        }
    }
}
