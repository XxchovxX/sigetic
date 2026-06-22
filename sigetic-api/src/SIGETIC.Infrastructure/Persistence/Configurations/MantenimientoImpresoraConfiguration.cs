using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SIGETIC.Domain.Entities;

namespace SIGETIC.Infrastructure.Persistence.Configurations;

public sealed class MantenimientoImpresoraConfiguration : IEntityTypeConfiguration<MantenimientoImpresora>
{
    public void Configure(EntityTypeBuilder<MantenimientoImpresora> entity)
    {
        entity.ToTable("mantenimientos_impresora");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id");

        entity.Property(e => e.ImpresoraId)
            .HasColumnName("impresora_id")
            .IsRequired();

        entity.Property(e => e.TipoMantenimiento)
            .HasColumnName("tipo_mantenimiento")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.FechaMantenimiento)
            .HasColumnName("fecha_mantenimiento")
            .IsRequired();

        entity.Property(e => e.TecnicoResponsable)
            .HasColumnName("tecnico_responsable")
            .HasMaxLength(180)
            .IsRequired();

        entity.Property(e => e.Diagnostico)
            .HasColumnName("diagnostico")
            .HasMaxLength(1500)
            .IsRequired();

        entity.Property(e => e.ActividadesRealizadas)
            .HasColumnName("actividades_realizadas")
            .HasMaxLength(2000)
            .IsRequired();

        entity.Property(e => e.RepuestosUtilizados)
            .HasColumnName("repuestos_utilizados")
            .HasMaxLength(1000);

        entity.Property(e => e.ContadorPaginas)
            .HasColumnName("contador_paginas");

        entity.Property(e => e.EstadoResultante)
            .HasColumnName("estado_resultante")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.ProximaRevision)
            .HasColumnName("proxima_revision");

        entity.Property(e => e.Observaciones)
            .HasColumnName("observaciones")
            .HasMaxLength(1500);

        entity.Property(e => e.FirmaTecnico)
            .HasColumnName("firma_tecnico")
            .HasColumnType("text");

        entity.Property(e => e.FirmaRecibe)
            .HasColumnName("firma_recibe")
            .HasColumnType("text");

        entity.Property(e => e.NombreRecibe)
            .HasColumnName("nombre_recibe")
            .HasMaxLength(180);

        entity.Property(e => e.DocumentoRecibe)
            .HasColumnName("documento_recibe")
            .HasMaxLength(80);

        entity.Property(e => e.FechaFirmaUtc)
            .HasColumnName("fecha_firma_utc");

        entity.Property(e => e.FechaCreacionUtc)
            .HasColumnName("fecha_creacion_utc")
            .IsRequired();

        entity.HasOne(e => e.Impresora)
            .WithMany()
            .HasForeignKey(e => e.ImpresoraId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(e => e.ImpresoraId);
        entity.HasIndex(e => e.FechaMantenimiento);
    }
}
