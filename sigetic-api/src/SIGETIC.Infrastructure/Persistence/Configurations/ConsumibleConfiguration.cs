using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SIGETIC.Domain.Entities;

namespace SIGETIC.Infrastructure.Persistence.Configurations;

public sealed class ConsumibleConfiguration : IEntityTypeConfiguration<Consumible>
{
    public void Configure(EntityTypeBuilder<Consumible> entity)
    {
        entity.ToTable("consumibles");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id");

        entity.Property(e => e.CodigoInterno)
            .HasColumnName("codigo_interno")
            .HasMaxLength(50)
            .IsRequired();

        entity.HasIndex(e => e.CodigoInterno)
            .IsUnique();

        entity.Property(e => e.Nombre)
            .HasColumnName("nombre")
            .HasMaxLength(180)
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

        entity.Property(e => e.UnidadMedida)
            .HasColumnName("unidad_medida")
            .HasMaxLength(60)
            .IsRequired();

        entity.Property(e => e.StockActual)
            .HasColumnName("stock_actual")
            .IsRequired();

        entity.Property(e => e.StockMinimo)
            .HasColumnName("stock_minimo")
            .IsRequired();

        entity.Property(e => e.CostoUnitario)
            .HasColumnName("costo_unitario")
            .HasPrecision(14, 2)
            .IsRequired();

        entity.Property(e => e.MarcaCompatible)
            .HasColumnName("marca_compatible")
            .HasMaxLength(150);

        entity.Property(e => e.ModelosCompatibles)
            .HasColumnName("modelos_compatibles")
            .HasMaxLength(1000);

        entity.Property(e => e.Observaciones)
            .HasColumnName("observaciones")
            .HasMaxLength(1500);

        entity.Property(e => e.Activo)
            .HasColumnName("activo")
            .IsRequired();

        entity.Property(e => e.FechaCreacionUtc)
            .HasColumnName("fecha_creacion_utc")
            .IsRequired();

        entity.Property(e => e.FechaActualizacionUtc)
            .HasColumnName("fecha_actualizacion_utc");

        entity.Ignore(e => e.BajoStock);
    }
}
