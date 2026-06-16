using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketAuditAndSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "eliminado",
                table: "tickets_mesa_ayuda",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "eliminado_por",
                table: "tickets_mesa_ayuda",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_eliminacion_utc",
                table: "tickets_mesa_ayuda",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "tickets_mesa_ayuda_historial",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    ticket_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_evento = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    usuario = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    estado_anterior = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    estado_nuevo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    detalle = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: true),
                    fecha_evento_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tickets_mesa_ayuda_historial", x => x.id);
                    table.ForeignKey(
                        name: "FK_tickets_mesa_ayuda_historial_tickets_mesa_ayuda_ticket_id",
                        column: x => x.ticket_id,
                        principalTable: "tickets_mesa_ayuda",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_eliminado",
                table: "tickets_mesa_ayuda",
                column: "eliminado");

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_historial_fecha_evento_utc",
                table: "tickets_mesa_ayuda_historial",
                column: "fecha_evento_utc");

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_historial_ticket_id",
                table: "tickets_mesa_ayuda_historial",
                column: "ticket_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tickets_mesa_ayuda_historial");

            migrationBuilder.DropIndex(
                name: "IX_tickets_mesa_ayuda_eliminado",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "eliminado",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "eliminado_por",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "fecha_eliminacion_utc",
                table: "tickets_mesa_ayuda");
        }
    }
}
