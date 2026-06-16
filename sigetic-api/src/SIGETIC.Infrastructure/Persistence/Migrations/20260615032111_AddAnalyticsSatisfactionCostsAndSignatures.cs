using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAnalyticsSatisfactionCostsAndSignatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "calificacion_amabilidad",
                table: "tickets_mesa_ayuda",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "calificacion_atencion",
                table: "tickets_mesa_ayuda",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "calificacion_solucion",
                table: "tickets_mesa_ayuda",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "calificacion_tiempo",
                table: "tickets_mesa_ayuda",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "comentario_satisfaccion",
                table: "tickets_mesa_ayuda",
                type: "character varying(1200)",
                maxLength: 1200,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_encuesta_utc",
                table: "tickets_mesa_ayuda",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "costo_total",
                table: "movimientos_consumibles",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "costo_unitario",
                table: "movimientos_consumibles",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "documento_recibe",
                table: "mantenimientos_impresora",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_firma_utc",
                table: "mantenimientos_impresora",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "firma_recibe",
                table: "mantenimientos_impresora",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "firma_tecnico",
                table: "mantenimientos_impresora",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nombre_recibe",
                table: "mantenimientos_impresora",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "documento_recibe",
                table: "mantenimientos_equipo",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_firma_utc",
                table: "mantenimientos_equipo",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "firma_recibe",
                table: "mantenimientos_equipo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "firma_tecnico",
                table: "mantenimientos_equipo",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "nombre_recibe",
                table: "mantenimientos_equipo",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "costo_unitario",
                table: "consumibles",
                type: "numeric(14,2)",
                precision: 14,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "calificacion_amabilidad",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "calificacion_atencion",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "calificacion_solucion",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "calificacion_tiempo",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "comentario_satisfaccion",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "fecha_encuesta_utc",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropColumn(
                name: "costo_total",
                table: "movimientos_consumibles");

            migrationBuilder.DropColumn(
                name: "costo_unitario",
                table: "movimientos_consumibles");

            migrationBuilder.DropColumn(
                name: "documento_recibe",
                table: "mantenimientos_impresora");

            migrationBuilder.DropColumn(
                name: "fecha_firma_utc",
                table: "mantenimientos_impresora");

            migrationBuilder.DropColumn(
                name: "firma_recibe",
                table: "mantenimientos_impresora");

            migrationBuilder.DropColumn(
                name: "firma_tecnico",
                table: "mantenimientos_impresora");

            migrationBuilder.DropColumn(
                name: "nombre_recibe",
                table: "mantenimientos_impresora");

            migrationBuilder.DropColumn(
                name: "documento_recibe",
                table: "mantenimientos_equipo");

            migrationBuilder.DropColumn(
                name: "fecha_firma_utc",
                table: "mantenimientos_equipo");

            migrationBuilder.DropColumn(
                name: "firma_recibe",
                table: "mantenimientos_equipo");

            migrationBuilder.DropColumn(
                name: "firma_tecnico",
                table: "mantenimientos_equipo");

            migrationBuilder.DropColumn(
                name: "nombre_recibe",
                table: "mantenimientos_equipo");

            migrationBuilder.DropColumn(
                name: "costo_unitario",
                table: "consumibles");
        }
    }
}
