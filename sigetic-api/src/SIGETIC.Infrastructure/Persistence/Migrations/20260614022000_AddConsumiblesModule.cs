using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConsumiblesModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "consumibles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_interno = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    nombre = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    tipo_consumible = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    referencia = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    color = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    unidad_medida = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    stock_actual = table.Column<int>(type: "integer", nullable: false),
                    stock_minimo = table.Column<int>(type: "integer", nullable: false),
                    marca_compatible = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    modelos_compatibles = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_consumibles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "movimientos_consumibles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    consumible_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha_movimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    tipo_movimiento = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    cantidad = table.Column<int>(type: "integer", nullable: false),
                    responsable = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    destino = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    dependencia_id = table.Column<Guid>(type: "uuid", nullable: true),
                    impresora_id = table.Column<Guid>(type: "uuid", nullable: true),
                    documento_soporte = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    stock_resultante = table.Column<int>(type: "integer", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movimientos_consumibles", x => x.id);
                    table.ForeignKey(
                        name: "FK_movimientos_consumibles_consumibles_consumible_id",
                        column: x => x.consumible_id,
                        principalTable: "consumibles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movimientos_consumibles_dependencias_dependencia_id",
                        column: x => x.dependencia_id,
                        principalTable: "dependencias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_movimientos_consumibles_impresoras_impresora_id",
                        column: x => x.impresora_id,
                        principalTable: "impresoras",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_consumibles_codigo_interno",
                table: "consumibles",
                column: "codigo_interno",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_consumibles_consumible_id",
                table: "movimientos_consumibles",
                column: "consumible_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_consumibles_dependencia_id",
                table: "movimientos_consumibles",
                column: "dependencia_id");

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_consumibles_fecha_movimiento",
                table: "movimientos_consumibles",
                column: "fecha_movimiento");

            migrationBuilder.CreateIndex(
                name: "IX_movimientos_consumibles_impresora_id",
                table: "movimientos_consumibles",
                column: "impresora_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "movimientos_consumibles");

            migrationBuilder.DropTable(
                name: "consumibles");
        }
    }
}
