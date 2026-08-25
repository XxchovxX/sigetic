using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SIGETIC.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFormacionModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "formacion_cursos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    titulo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    descripcion = table.Column<string>(type: "character varying(1200)", maxLength: 1200, nullable: false),
                    categoria = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    dirigido_a = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    duracion_minutos = table.Column<int>(type: "integer", nullable: false),
                    puntaje_minimo = table.Column<int>(type: "integer", nullable: false),
                    activo = table.Column<bool>(type: "boolean", nullable: false),
                    fecha_creacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    fecha_actualizacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_cursos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "formacion_intentos",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    curso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
                    participante_nombre = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    participante_correo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    total_preguntas = table.Column<int>(type: "integer", nullable: false),
                    respuestas_correctas = table.Column<int>(type: "integer", nullable: false),
                    puntaje = table.Column<int>(type: "integer", nullable: false),
                    aprobado = table.Column<bool>(type: "boolean", nullable: false),
                    codigo_certificado = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    fecha_presentacion_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_intentos", x => x.id);
                    table.ForeignKey(
                        name: "FK_formacion_intentos_formacion_cursos_curso_id",
                        column: x => x.curso_id,
                        principalTable: "formacion_cursos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "formacion_materiales",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    curso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    titulo = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    tipo = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    url = table.Column<string>(type: "character varying(800)", maxLength: 800, nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_materiales", x => x.id);
                    table.ForeignKey(
                        name: "FK_formacion_materiales_formacion_cursos_curso_id",
                        column: x => x.curso_id,
                        principalTable: "formacion_cursos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "formacion_preguntas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    curso_id = table.Column<Guid>(type: "uuid", nullable: false),
                    texto = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    explicacion = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_preguntas", x => x.id);
                    table.ForeignKey(
                        name: "FK_formacion_preguntas_formacion_cursos_curso_id",
                        column: x => x.curso_id,
                        principalTable: "formacion_cursos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "formacion_opciones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    pregunta_id = table.Column<Guid>(type: "uuid", nullable: false),
                    texto = table.Column<string>(type: "character varying(600)", maxLength: 600, nullable: false),
                    es_correcta = table.Column<bool>(type: "boolean", nullable: false),
                    orden = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_opciones", x => x.id);
                    table.ForeignKey(
                        name: "FK_formacion_opciones_formacion_preguntas_pregunta_id",
                        column: x => x.pregunta_id,
                        principalTable: "formacion_preguntas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "formacion_respuestas",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    intento_id = table.Column<Guid>(type: "uuid", nullable: false),
                    pregunta_id = table.Column<Guid>(type: "uuid", nullable: false),
                    opcion_id = table.Column<Guid>(type: "uuid", nullable: false),
                    correcta = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_formacion_respuestas", x => x.id);
                    table.ForeignKey(
                        name: "FK_formacion_respuestas_formacion_intentos_intento_id",
                        column: x => x.intento_id,
                        principalTable: "formacion_intentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_formacion_respuestas_formacion_opciones_opcion_id",
                        column: x => x.opcion_id,
                        principalTable: "formacion_opciones",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_formacion_respuestas_formacion_preguntas_pregunta_id",
                        column: x => x.pregunta_id,
                        principalTable: "formacion_preguntas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_formacion_cursos_activo",
                table: "formacion_cursos",
                column: "activo");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_cursos_categoria",
                table: "formacion_cursos",
                column: "categoria");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_intentos_codigo_certificado",
                table: "formacion_intentos",
                column: "codigo_certificado",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_formacion_intentos_curso_id",
                table: "formacion_intentos",
                column: "curso_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_intentos_usuario_id",
                table: "formacion_intentos",
                column: "usuario_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_materiales_curso_id",
                table: "formacion_materiales",
                column: "curso_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_opciones_pregunta_id",
                table: "formacion_opciones",
                column: "pregunta_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_preguntas_curso_id",
                table: "formacion_preguntas",
                column: "curso_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_respuestas_intento_id",
                table: "formacion_respuestas",
                column: "intento_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_respuestas_opcion_id",
                table: "formacion_respuestas",
                column: "opcion_id");

            migrationBuilder.CreateIndex(
                name: "IX_formacion_respuestas_pregunta_id",
                table: "formacion_respuestas",
                column: "pregunta_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "formacion_materiales");

            migrationBuilder.DropTable(
                name: "formacion_respuestas");

            migrationBuilder.DropTable(
                name: "formacion_intentos");

            migrationBuilder.DropTable(
                name: "formacion_opciones");

            migrationBuilder.DropTable(
                name: "formacion_preguntas");

            migrationBuilder.DropTable(
                name: "formacion_cursos");
        }
    }
}
