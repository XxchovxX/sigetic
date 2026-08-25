using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvancedTrainingQuestionsAndCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "opcion_id",
                table: "formacion_respuestas",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<bool>(
                name: "correcta",
                table: "formacion_respuestas",
                type: "boolean",
                nullable: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AddColumn<string>(
                name: "datos_respuesta",
                table: "formacion_respuestas",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "respuesta_texto",
                table: "formacion_respuestas",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo",
                table: "formacion_preguntas",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "SeleccionUnica");

            migrationBuilder.AddColumn<string>(
                name: "texto_relacionado",
                table: "formacion_opciones",
                type: "character varying(600)",
                maxLength: 600,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "entidad_certificadora",
                table: "formacion_cursos",
                type: "character varying(180)",
                maxLength: 180,
                nullable: false,
                defaultValue: "Secretaría de Planeación");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "datos_respuesta",
                table: "formacion_respuestas");

            migrationBuilder.DropColumn(
                name: "respuesta_texto",
                table: "formacion_respuestas");

            migrationBuilder.DropColumn(
                name: "tipo",
                table: "formacion_preguntas");

            migrationBuilder.DropColumn(
                name: "texto_relacionado",
                table: "formacion_opciones");

            migrationBuilder.DropColumn(
                name: "entidad_certificadora",
                table: "formacion_cursos");

            migrationBuilder.AlterColumn<Guid>(
                name: "opcion_id",
                table: "formacion_respuestas",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "correcta",
                table: "formacion_respuestas",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);
        }
    }
}
