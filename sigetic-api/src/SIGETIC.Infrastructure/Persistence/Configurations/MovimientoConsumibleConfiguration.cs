using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SIGETIC.Domain.Entities;

namespace SIGETIC.Infrastructure.Persistence.Configurations;

public sealed class MovimientoConsumibleConfiguration : IEntityTypeConfiguration<MovimientoConsumible>
{
    public void Configure(EntityTypeBuilder<MovimientoConsumible> entity)
    {
        entity.ToTable("movimientos_consumibles");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id");

        entity.Property(e => e.ConsumibleId)
            .HasColumnName("consumible_id")
            .IsRequired();

        entity.Property(e => e.FechaMovimiento)
            .HasColumnName("fecha_movimiento")
            .IsRequired();

        entity.Property(e => e.TipoMovimiento)
            .HasColumnName("tipo_movimiento")
            .HasMaxLength(30)
            .IsRequired();

        entity.Property(e => e.Cantidad)
            .HasColumnName("cantidad")
            .IsRequired();

        entity.Property(e => e.Responsable)
            .HasColumnName("responsable")
            .HasMaxLength(180)
            .IsRequired();

        entity.Property(e => e.Destino)
            .HasColumnName("destino")
            .HasMaxLength(180);

        entity.Property(e => e.DependenciaId)
            .HasColumnName("dependencia_id");

        entity.Property(e => e.ImpresoraId)
            .HasColumnName("impresora_id");

        entity.Property(e => e.DocumentoSoporte)
            .HasColumnName("documento_soporte")
            .HasMaxLength(180);

        entity.Property(e => e.Observaciones)
            .HasColumnName("observaciones")
            .HasMaxLength(1500);

        entity.Property(e => e.StockResultante)
            .HasColumnName("stock_resultante")
            .IsRequired();

        entity.Property(e => e.CostoUnitario)
            .HasColumnName("costo_unitario")
            .HasPrecision(14, 2)
            .IsRequired();

        entity.Property(e => e.CostoTotal)
            .HasColumnName("costo_total")
            .HasPrecision(14, 2)
            .IsRequired();

        entity.Property(e => e.FechaCreacionUtc)
            .HasColumnName("fecha_creacion_utc")
            .IsRequired();

        entity.HasOne(e => e.Consumible)
            .WithMany()
            .HasForeignKey(e => e.ConsumibleId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(e => e.Dependencia)
            .WithMany()
            .HasForeignKey(e => e.DependenciaId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.Impresora)
            .WithMany()
            .HasForeignKey(e => e.ImpresoraId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasIndex(e => e.ConsumibleId);
        entity.HasIndex(e => e.FechaMovimiento);
        entity.HasIndex(e => e.DependenciaId);
        entity.HasIndex(e => e.ImpresoraId);
    }
}
