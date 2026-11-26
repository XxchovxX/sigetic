using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace SIGETIC.Infrastructure.Persistence.Migrations;

[DbContext(typeof(SigeticDbContext))]
[Migration("20261126170000_AddDocumentosFirma")]
public sealed class AddDocumentosFirma : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE documentos_firma (
            id uuid PRIMARY KEY,
            creador_id uuid NOT NULL,
            firmantes uuid[] NOT NULL,
            creado_utc timestamptz NOT NULL,
            revision integer NOT NULL DEFAULT 0,
            datos jsonb NOT NULL,
            pdf_original bytea NOT NULL,
            pdf_final bytea
        );
        CREATE INDEX ix_documentos_firma_creador ON documentos_firma (creador_id, creado_utc DESC);
        CREATE INDEX ix_documentos_firma_firmantes ON documentos_firma USING gin (firmantes);
        """);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.Sql("DROP TABLE documentos_firma;");
}
