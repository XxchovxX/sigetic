using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleProfilesAndTrainingAudiences : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cargo",
                table: "usuarios",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "dependencia_id",
                table: "usuarios",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "google_subject",
                table: "usuarios",
                type: "character varying(180)",
                maxLength: 180,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_vinculacion",
                table: "usuarios",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "usuario_solicitante_id",
                table: "tickets_mesa_ayuda",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "formacion_cursos_dependencias",
                columns: table => new
                {
                    curso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    dependencia_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_cursos_dependencias", x => new { x.curso_id, x.dependencia_id });
                    table.ForeignKey(
                        name: "FK_formacion_cursos_dependencias_dependencias_dependencia_id",
                        column: x => x.dependencia_id,
                        principalTable: "dependencias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_formacion_cursos_dependencias_formacion_cursos_curso_id",
                        column: x => x.curso_id,
                        principalTable: "formacion_cursos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "formacion_cursos_usuarios",
                columns: table => new
                {
                    curso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_cursos_usuarios", x => new { x.curso_id, x.usuario_id });
                    table.ForeignKey(
                        name: "FK_formacion_cursos_usuarios_formacion_cursos_curso_id",
                        column: x => x.curso_id,
                        principalTable: "formacion_cursos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_formacion_cursos_usuarios_usuarios_usuario_id",
                        column: x => x.usuario_id,
                        principalTable: "usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(
                """
                INSERT INTO dependencias
                    (id, activa, codigo, correo, fecha_actualizacion_utc, fecha_creacion_utc, nombre, responsable)
                VALUES
                    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', TRUE, 'SAF', NULL, NULL, TIMESTAMPTZ '2026-01-01 00:00:00Z', 'Secretaría Administrativa y Financiera', 'Secretaría Administrativa y Financiera'),
                    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', TRUE, 'SAL', NULL, NULL, TIMESTAMPTZ '2026-01-01 00:00:00Z', 'Secretaría de Salud y Desarrollo Social', 'Secretaría de Salud y Desarrollo Social'),
                    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', TRUE, 'GOB', NULL, NULL, TIMESTAMPTZ '2026-01-01 00:00:00Z', 'Secretaría de Gobierno', 'Secretaría de Gobierno')
                ON CONFLICT DO NOTHING;
                """);

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999901"),
                columns: new[] { "cargo", "dependencia_id", "google_subject", "tipo_vinculacion" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999902"),
                columns: new[] { "cargo", "dependencia_id", "google_subject", "tipo_vinculacion" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999903"),
                columns: new[] { "cargo", "dependencia_id", "google_subject", "tipo_vinculacion" },
                values: new object[] { null, null, null, null });

            migrationBuilder.UpdateData(
                table: "usuarios",
                keyColumn: "id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"),
                columns: new[] { "cargo", "dependencia_id", "google_subject", "tipo_vinculacion" },
                values: new object[] { null, null, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_dependencia_id",
                table: "usuarios",
                column: "dependencia_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_google_subject",
                table: "usuarios",
                column: "google_subject",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tickets_mesa_ayuda_usuario_solicitante_id",
                table: "tickets_mesa_ayuda",
                column: "usuario_solicitante_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_cursos_dependencias_dependencia_id",
                table: "formacion_cursos_dependencias",
                column: "dependencia_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_cursos_usuarios_usuario_id",
                table: "formacion_cursos_usuarios",
                column: "usuario_id");

            migrationBuilder.AddForeignKey(
                name: "FK_tickets_mesa_ayuda_usuarios_usuario_solicitante_id",
                table: "tickets_mesa_ayuda",
                column: "usuario_solicitante_id",
                principalTable: "usuarios",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_usuarios_dependencias_dependencia_id",
                table: "usuarios",
                column: "dependencia_id",
                principalTable: "dependencias",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_tickets_mesa_ayuda_usuarios_usuario_solicitante_id",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DropForeignKey(
                name: "FK_usuarios_dependencias_dependencia_id",
                table: "usuarios");

            migrationBuilder.DropTable(
                name: "formacion_cursos_dependencias");

            migrationBuilder.DropTable(
                name: "formacion_cursos_usuarios");

            migrationBuilder.DropIndex(
                name: "IX_usuarios_dependencia_id",
                table: "usuarios");

            migrationBuilder.DropIndex(
                name: "IX_usuarios_google_subject",
                table: "usuarios");

            migrationBuilder.DropIndex(
                name: "IX_tickets_mesa_ayuda_usuario_solicitante_id",
                table: "tickets_mesa_ayuda");

            migrationBuilder.DeleteData(
                table: "dependencias",
                keyColumn: "id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3"));

            migrationBuilder.DeleteData(
                table: "dependencias",
                keyColumn: "id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4"));

            migrationBuilder.DeleteData(
                table: "dependencias",
                keyColumn: "id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5"));

            migrationBuilder.DropColumn(
                name: "cargo",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "dependencia_id",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "google_subject",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "tipo_vinculacion",
                table: "usuarios");

            migrationBuilder.DropColumn(
                name: "usuario_solicitante_id",
                table: "tickets_mesa_ayuda");
        }
    }
}
