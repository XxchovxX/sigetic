using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SIGETIC.Domain.Entities;

namespace SIGETIC.Infrastructure.Persistence.Configurations;

public sealed class HistorialConsumibleImpresoraConfiguration : IEntityTypeConfiguration<HistorialConsumibleImpresora>
{
    public void Configure(EntityTypeBuilder<HistorialConsumibleImpresora> entity)
    {
        entity.ToTable("historial_consumibles_impresora");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id");

        entity.Property(e => e.ImpresoraId)
            .HasColumnName("impresora_id")
            .IsRequired();

        entity.Property(e => e.FechaMovimiento)
            .HasColumnName("fecha_movimiento")
            .IsRequired();

        entity.Property(e => e.TipoMovimiento)
            .HasColumnName("tipo_movimiento")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.TipoConsumible)
            .HasColumnName("tipo_consumible")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.Referencia)
            .HasColumnName("referencia")
            .HasMaxLength(150)
            .IsRequired();

        entity.Property(e => e.Color)
            .HasColumnName("color")
            .HasMaxLength(80)
            .IsRequired();

        entity.Property(e => e.Cantidad)
            .HasColumnName("cantidad")
            .IsRequired();

        entity.Property(e => e.ResponsableEntrega)
            .HasColumnName("responsable_entrega")
            .HasMaxLength(180)
            .IsRequired();

        entity.Property(e => e.ContadorPaginas)
            .HasColumnName("contador_paginas");

        entity.Property(e => e.Observaciones)
            .HasColumnName("observaciones")
            .HasMaxLength(1500);

        entity.Property(e => e.FechaCreacionUtc)
            .HasColumnName("fecha_creacion_utc")
            .IsRequired();

        entity.HasOne(e => e.Impresora)
            .WithMany()
            .HasForeignKey(e => e.ImpresoraId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasIndex(e => e.ImpresoraId);
        entity.HasIndex(e => e.FechaMovimiento);
    }
}