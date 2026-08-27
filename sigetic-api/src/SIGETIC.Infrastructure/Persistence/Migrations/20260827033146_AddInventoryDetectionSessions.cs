using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryDetectionSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inventario_detecciones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    estado = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    datos_json = table.Column<string>(type: "jsonb", nullable: true),
                    direccion_ip_origen = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expira_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_recepcion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_inventario_detecciones", x => x.id);
                    table.ForeignKey(
                        name: "FK_inventario_detecciones_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_inventario_detecciones_expira_utc",
                table: "inventario_detecciones",
                column: "expira_utc");

            migrationBuilder.CreateIndex(
                name: "IX_inventario_detecciones_token_hash",
                table: "inventario_detecciones",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_inventario_detecciones_usuario_id_fecha_creacion_utc",
                table: "inventario_detecciones",
                columns: new[] { "usuario_id", "fecha_creacion_utc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inventario_detecciones");
        }
    }
}
