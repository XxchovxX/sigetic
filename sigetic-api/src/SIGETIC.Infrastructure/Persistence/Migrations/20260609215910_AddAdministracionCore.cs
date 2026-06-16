using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdministracionCore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "dependencias",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    codigo = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    responsable = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    correo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    activa = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dependencias", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "permisos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    codigo = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    modulo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    accion = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_permisos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "roles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    es_sistema = table.Column<bool>(type: "boolean", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "funcionarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre_completo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    documento = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    cargo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    dependencia_id = table.Column<Guid>(type: "uuid", nullable: false),
                    correo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: true),
                    telefono = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_funcionarios", x => x.id);
                    table.ForeignKey(
                        name: "FK_funcionarios_dependencias_dependencia_id",
                        column: x => x.dependencia_id,
                        principalTable: "dependencias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "roles_permisos",
                columns: table => new
                {
                    rol_id = table.Column<Guid>(type: "uuid", nullable: false),
                    permiso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_roles_permisos", x => new { x.rol_id, x.permiso_id });
                    table.ForeignKey(
                        name: "FK_roles_permisos_permisos_permiso_id",
                        column: x => x.permiso_id,
                        principalTable: "permisos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_roles_permisos_roles_rol_id",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "usuarios",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    nombre_completo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    correo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    rol_id = table.Column<Guid>(type: "uuid", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ultimo_acceso_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_usuarios", x => x.id);
                    table.ForeignKey(
                        name: "FK_usuarios_roles_rol_id",
                        column: x => x.rol_id,
                        principalTable: "roles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "dependencias",
                columns: new[] { "id", "activa", "codigo", "correo", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre", "responsable" },
                values: new object[,]
                {
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"), true, "PLA", null, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Secretaría de Planeación", "Secretaría de Planeación" },
                    { new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2"), true, "SIS", null, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sistemas", "Profesional TIC" }
                });

            migrationBuilder.InsertData(
                table: "roles",
                columns: new[] { "id", "activo", "descripcion", "es_sistema", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), true, "Acceso total al sistema SIGETIC.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrador" },
                    { new Guid("22222222-2222-2222-2222-222222222222"), true, "Gestión técnica de inventario, mantenimientos, impresoras, consumibles y mesa de ayuda.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Ingeniero TIC" },
                    { new Guid("33333333-3333-3333-3333-333333333333"), true, "Apoyo operativo en mantenimientos, tickets, impresoras y consumibles.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Auxiliar de Sistemas" },
                    { new Guid("44444444-4444-4444-4444-444444444444"), true, "Usuario interno para creación y consulta de solicitudes.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Funcionario" },
                    { new Guid("55555555-5555-5555-5555-555555555555"), true, "Acceso de solo consulta a reportes y trazabilidad.", true, null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Consulta / Control Interno" }
                });

            migrationBuilder.InsertData(
                table: "usuarios",
                columns: new[] { "id", "activo", "correo", "fecha_actualizacion_utc", "fecha_creacion_utc", "nombre_completo", "password_hash", "rol_id", "ultimo_acceso_utc" },
                values: new object[] { new Guid("99999999-9999-9999-9999-999999999999"), true, "admin@sigetic.local", null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Administrador SIGETIC", "PBKDF2$100000$U0lHRVRJQy1TRUVELTEyMw==$oVgabe+uhoKIpI5ySW5DiJV57uFA33l7lzdffPwU30A=", new Guid("11111111-1111-1111-1111-111111111111"), null });

            migrationBuilder.CreateIndex(
                name: "IX_dependencias_codigo",
                table: "dependencias",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_dependencias_nombre",
                table: "dependencias",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_funcionarios_dependencia_id",
                table: "funcionarios",
                column: "dependencia_id");

            migrationBuilder.CreateIndex(
                name: "IX_funcionarios_documento",
                table: "funcionarios",
                column: "documento",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_permisos_codigo",
                table: "permisos",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_nombre",
                table: "roles",
                column: "nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_roles_permisos_permiso_id",
                table: "roles_permisos",
                column: "permiso_id");

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_correo",
                table: "usuarios",
                column: "correo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_usuarios_rol_id",
                table: "usuarios",
                column: "rol_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "funcionarios");

            migrationBuilder.DropTable(
                name: "roles_permisos");

            migrationBuilder.DropTable(
                name: "usuarios");

            migrationBuilder.DropTable(
                name: "dependencias");

            migrationBuilder.DropTable(
                name: "permisos");

            migrationBuilder.DropTable(
                name: "roles");
        }
    }
}
