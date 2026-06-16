using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SIGETIC.Domain.Entities;

namespace SIGETIC.Infrastructure.Persistence.Configurations;

public sealed class ImpresoraConfiguration : IEntityTypeConfiguration<Impresora>
{
    public void Configure(EntityTypeBuilder<Impresora> entity)
    {
        entity.ToTable("impresoras");

        entity.HasKey(e => e.Id);

        entity.Property(e => e.Id)
            .HasColumnName("id");

        entity.Property(e => e.CodigoInterno)
            .HasColumnName("codigo_interno")
            .HasMaxLength(50)
            .IsRequired();

        entity.HasIndex(e => e.CodigoInterno)
            .IsUnique();

        entity.Property(e => e.Marca)
            .HasColumnName("marca")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.Modelo)
            .HasColumnName("modelo")
            .HasMaxLength(120)
            .IsRequired();

        entity.Property(e => e.Serial)
            .HasColumnName("serial")
            .HasMaxLength(150)
            .IsRequired();

        entity.HasIndex(e => e.Serial)
            .IsUnique();

        entity.Property(e => e.TipoImpresora)
            .HasColumnName("tipo_impresora")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.TecnologiaImpresion)
            .HasColumnName("tecnologia_impresion")
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(e => e.DependenciaId)
            .HasColumnName("dependencia_id")
            .IsRequired();

        entity.Property(e => e.FuncionarioAsignadoId)
            .HasColumnName("funcionario_asignado_id");

        entity.Property(e => e.Estado)
            .HasColumnName("estado")
            .HasMaxLength(80)
            .IsRequired();

        entity.Property(e => e.UbicacionFisica)
            .HasColumnName("ubicacion_fisica")
            .HasMaxLength(180)
            .IsRequired();

        entity.Property(e => e.DireccionIp)
            .HasColumnName("direccion_ip")
            .HasMaxLength(45);

        entity.Property(e => e.DireccionMac)
            .HasColumnName("direccion_mac")
            .HasMaxLength(60);

        entity.Property(e => e.FechaIngreso)
            .HasColumnName("fecha_ingreso")
            .IsRequired();

        entity.Property(e => e.Observaciones)
            .HasColumnName("observaciones")
            .HasMaxLength(1500);

        entity.Property(e => e.FechaCreacionUtc)
            .HasColumnName("fecha_creacion_utc")
            .IsRequired();

        entity.Property(e => e.FechaActualizacionUtc)
            .HasColumnName("fecha_actualizacion_utc");

        entity.HasOne(e => e.Dependencia)
            .WithMany()
            .HasForeignKey(e => e.DependenciaId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(e => e.FuncionarioAsignado)
            .WithMany()
            .HasForeignKey(e => e.FuncionarioAsignadoId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}