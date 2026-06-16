using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddImpresorasModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "impresoras",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo_interno = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    marca = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    modelo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    serial = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    tipo_impresora = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tecnologia_impresion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    dependencia_id = table.Column<Guid>(type: "uuid", nullable: false),
                    funcionario_asignado_id = table.Column<Guid>(type: "uuid", nullable: true),
                    estado = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    ubicacion_fisica = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    direccion_ip = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                    direccion_mac = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    fecha_ingreso = table.Column<DateOnly>(type: "date", nullable: false),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_impresoras", x => x.id);
                    table.ForeignKey(
                        name: "FK_impresoras_dependencias_dependencia_id",
                        column: x => x.dependencia_id,
                        principalTable: "dependencias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_impresoras_funcionarios_funcionario_asignado_id",
                        column: x => x.funcionario_asignado_id,
                        principalTable: "funcionarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "historial_consumibles_impresora",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    impresora_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha_movimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    tipo_movimiento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tipo_consumible = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    referencia = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    color = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    cantidad = table.Column<int>(type: "integer", nullable: false),
                    responsable_entrega = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    contador_paginas = table.Column<int>(type: "integer", nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_historial_consumibles_impresora", x => x.id);
                    table.ForeignKey(
                        name: "FK_historial_consumibles_impresora_impresoras_impresora_id",
                        column: x => x.impresora_id,
                        principalTable: "impresoras",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mantenimientos_impresora",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    impresora_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tipo_mantenimiento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    fecha_mantenimiento = table.Column<DateOnly>(type: "date", nullable: false),
                    tecnico_responsable = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    diagnostico = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: false),
                    actividades_realizadas = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    repuestos_utilizados = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    contador_paginas = table.Column<int>(type: "integer", nullable: true),
                    estado_resultante = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    proxima_revision = table.Column<DateOnly>(type: "date", nullable: true),
                    observaciones = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: true),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_mantenimientos_impresora", x => x.id);
                    table.ForeignKey(
                        name: "FK_mantenimientos_impresora_impresoras_impresora_id",
                        column: x => x.impresora_id,
                        principalTable: "impresoras",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_historial_consumibles_impresora_fecha_movimiento",
                table: "historial_consumibles_impresora",
                column: "fecha_movimiento");

            migrationBuilder.CreateIndex(
                name: "IX_historial_consumibles_impresora_impresora_id",
                table: "historial_consumibles_impresora",
                column: "impresora_id");

            migrationBuilder.CreateIndex(
                name: "IX_impresoras_codigo_interno",
                table: "impresoras",
                column: "codigo_interno",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_impresoras_dependencia_id",
                table: "impresoras",
                column: "dependencia_id");

            migrationBuilder.CreateIndex(
                name: "IX_impresoras_funcionario_asignado_id",
                table: "impresoras",
                column: "funcionario_asignado_id");

            migrationBuilder.CreateIndex(
                name: "IX_impresoras_serial",
                table: "impresoras",
                column: "serial",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_mantenimientos_impresora_fecha_mantenimiento",
                table: "mantenimientos_impresora",
                column: "fecha_mantenimiento");

            migrationBuilder.CreateIndex(
                name: "IX_mantenimientos_impresora_impresora_id",
                table: "mantenimientos_impresora",
                column: "impresora_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "historial_consumibles_impresora");

            migrationBuilder.DropTable(
                name: "mantenimientos_impresora");

            migrationBuilder.DropTable(
                name: "impresoras");
        }
    }
}
