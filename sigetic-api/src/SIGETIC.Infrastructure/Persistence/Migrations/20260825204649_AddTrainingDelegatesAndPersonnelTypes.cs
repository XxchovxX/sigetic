using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainingDelegatesAndPersonnelTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "gestion_formacion_habilitada",
                table: "usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "gestion_formacion_hasta_utc",
                table: "usuarios",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_vinculacion",
                table: "funcionarios",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "Funcionario");

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                column: "gestion_formacion_hasta_utc",
                value: null);

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                column: "gestion_formacion_hasta_utc",
                value: null);

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                column: "gestion_formacion_hasta_utc",
                value: null);

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                column: "gestion_formacion_hasta_utc",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "gestion_formacion_habilitada",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "gestion_formacion_hasta_utc",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "tipo_vinculacion",
                table: "funcionarios");
        }
    }
}
