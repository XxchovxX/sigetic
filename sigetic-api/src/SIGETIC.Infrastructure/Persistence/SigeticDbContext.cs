using Microsoft.EntityFrameworkCore;
using SIGETIC.Domain.Entities;
using SIGETIC.Infrastructure.Security;

namespace SIGETIC.Infrastructure.Persistence;

public sealed class SigeticDbContext : DbContext
{
    public SigeticDbContext(DbContextOptions<SigeticDbContext> options)
        : base(options)
    {
    }

    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<MantenimientoEquipo> MantenimientosEquipo => Set<MantenimientoEquipo>();
    public DbSet<BajaEquipo> BajasEquipo => Set<BajaEquipo>();

    public DbSet<Rol> Roles => Set<Rol>();
    public DbSet<Permiso> Permisos => Set<Permiso>();
    public DbSet<RolPermiso> RolesPermisos => Set<RolPermiso>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Dependencia> Dependencias => Set<Dependencia>();
    public DbSet<Funcionario> Funcionarios => Set<Funcionario>();

    public DbSet<Impresora> Impresoras => Set<Impresora>();
    public DbSet<MantenimientoImpresora> MantenimientosImpresora => Set<MantenimientoImpresora>();
    public DbSet<HistorialConsumibleImpresora> HistorialConsumiblesImpresora => Set<HistorialConsumibleImpresora>();
    public DbSet<Consumible> Consumibles => Set<Consumible>();
    public DbSet<MovimientoConsumible> MovimientosConsumibles => Set<MovimientoConsumible>();
    public DbSet<TicketMesaAyuda> TicketsMesaAyuda => Set<TicketMesaAyuda>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SigeticDbContext).Assembly);

        ConfigureEquipos(modelBuilder);
        ConfigureMantenimientosEquipo(modelBuilder);
        ConfigureBajasEquipo(modelBuilder);
        ConfigureTicketsMesaAyuda(modelBuilder);

        ConfigureRoles(modelBuilder);
        ConfigurePermisos(modelBuilder);
        ConfigureRolesPermisos(modelBuilder);
        ConfigureUsuarios(modelBuilder);
        ConfigureDependencias(modelBuilder);
        ConfigureFuncionarios(modelBuilder);

        SeedAdministracion(modelBuilder);
    }

    private static void ConfigureEquipos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.ToTable("equipos");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.CodigoInterno)
                .HasColumnName("codigo_interno")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(e => e.CodigoInterno)
                .IsUnique();

            entity.Property(e => e.TipoEquipo)
                .HasColumnName("tipo_equipo")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.Marca)
                .HasColumnName("marca")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.Modelo)
                .HasColumnName("modelo")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Serial)
                .HasColumnName("serial")
                .HasMaxLength(120)
                .IsRequired();

            entity.HasIndex(e => e.Serial)
                .IsUnique();

            entity.Property(e => e.Dependencia)
                .HasColumnName("dependencia")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.FuncionarioAsignado)
                .HasColumnName("funcionario_asignado")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.Estado)
                .HasColumnName("estado")
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(e => e.Procesador)
                .HasColumnName("procesador")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.MemoriaRam)
                .HasColumnName("memoria_ram")
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(e => e.Almacenamiento)
                .HasColumnName("almacenamiento")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.SistemaOperativo)
                .HasColumnName("sistema_operativo")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.DireccionIp)
                .HasColumnName("direccion_ip")
                .HasMaxLength(45);

            entity.Property(e => e.DireccionMac)
                .HasColumnName("direccion_mac")
                .HasMaxLength(50);

            entity.Property(e => e.UbicacionFisica)
                .HasColumnName("ubicacion_fisica")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.FechaIngreso)
                .HasColumnName("fecha_ingreso")
                .IsRequired();

            entity.Property(e => e.Observaciones)
                .HasColumnName("observaciones")
                .HasMaxLength(1000);

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");
        });
    }

    private static void ConfigureMantenimientosEquipo(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<MantenimientoEquipo>(entity =>
        {
            entity.ToTable("mantenimientos_equipo");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.EquipoId)
                .HasColumnName("equipo_id")
                .IsRequired();

            entity.Property(e => e.TipoMantenimiento)
                .HasColumnName("tipo_mantenimiento")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.FechaMantenimiento)
                .HasColumnName("fecha_mantenimiento")
                .IsRequired();

            entity.Property(e => e.TecnicoResponsable)
                .HasColumnName("tecnico_responsable")
                .HasMaxLength(150)
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

            entity.Property(e => e.EstadoResultante)
                .HasColumnName("estado_resultante")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.ProximaRevision)
                .HasColumnName("proxima_revision");

            entity.Property(e => e.Observaciones)
                .HasColumnName("observaciones")
                .HasMaxLength(1500);

            entity.Property(e => e.FirmaTecnico)
                .HasColumnName("firma_tecnico")
                .HasMaxLength(500);

            entity.Property(e => e.FirmaRecibe)
                .HasColumnName("firma_recibe")
                .HasMaxLength(500);

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

            entity.HasOne(e => e.Equipo)
                .WithMany()
                .HasForeignKey(e => e.EquipoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.EquipoId);
            entity.HasIndex(e => e.FechaMantenimiento);
        });
    }

    private static void ConfigureBajasEquipo(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<BajaEquipo>(entity =>
        {
            entity.ToTable("bajas_equipo");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.EquipoId)
                .HasColumnName("equipo_id")
                .IsRequired();

            entity.Property(e => e.FechaBaja)
                .HasColumnName("fecha_baja")
                .IsRequired();

            entity.Property(e => e.MotivoBaja)
                .HasColumnName("motivo_baja")
                .HasMaxLength(1500)
                .IsRequired();

            entity.Property(e => e.ResponsableBaja)
                .HasColumnName("responsable_baja")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.EstadoFisico)
                .HasColumnName("estado_fisico")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.DisposicionFinal)
                .HasColumnName("disposicion_final")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.Observaciones)
                .HasColumnName("observaciones")
                .HasMaxLength(1500);

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.HasOne(e => e.Equipo)
                .WithMany()
                .HasForeignKey(e => e.EquipoId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.EquipoId)
                .IsUnique();

            entity.HasIndex(e => e.FechaBaja);
        });
    }

    private static void ConfigureTicketsMesaAyuda(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TicketMesaAyuda>(entity =>
        {
            entity.ToTable("tickets_mesa_ayuda");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.Codigo)
                .HasColumnName("codigo")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(e => e.Codigo)
                .IsUnique();

            entity.Property(e => e.FechaSolicitud)
                .HasColumnName("fecha_solicitud")
                .IsRequired();

            entity.Property(e => e.Solicitante)
                .HasColumnName("solicitante")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.Dependencia)
                .HasColumnName("dependencia")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.Categoria)
                .HasColumnName("categoria")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.Prioridad)
                .HasColumnName("prioridad")
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(e => e.Estado)
                .HasColumnName("estado")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.Descripcion)
                .HasColumnName("descripcion")
                .HasMaxLength(2000)
                .IsRequired();

            entity.Property(e => e.ResponsableAsignado)
                .HasColumnName("responsable_asignado")
                .HasMaxLength(180);

            entity.Property(e => e.EquipoCodigo)
                .HasColumnName("equipo_codigo")
                .HasMaxLength(80);

            entity.Property(e => e.ImpresoraCodigo)
                .HasColumnName("impresora_codigo")
                .HasMaxLength(80);

            entity.Property(e => e.FechaCompromiso)
                .HasColumnName("fecha_compromiso");

            entity.Property(e => e.Solucion)
                .HasColumnName("solucion")
                .HasMaxLength(2000);

            entity.Property(e => e.CalificacionTiempo)
                .HasColumnName("calificacion_tiempo");

            entity.Property(e => e.CalificacionAtencion)
                .HasColumnName("calificacion_atencion");

            entity.Property(e => e.CalificacionAmabilidad)
                .HasColumnName("calificacion_amabilidad");

            entity.Property(e => e.CalificacionSolucion)
                .HasColumnName("calificacion_solucion");

            entity.Property(e => e.ComentarioSatisfaccion)
                .HasColumnName("comentario_satisfaccion")
                .HasMaxLength(1200);

            entity.Property(e => e.FechaEncuestaUtc)
                .HasColumnName("fecha_encuesta_utc");

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");

            entity.HasIndex(e => e.Estado);
            entity.HasIndex(e => e.FechaSolicitud);
            entity.HasIndex(e => e.Prioridad);
        });
    }

    private static void ConfigureRoles(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Rol>(entity =>
        {
            entity.ToTable("roles");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.Nombre)
                .HasColumnName("nombre")
                .HasMaxLength(80)
                .IsRequired();

            entity.HasIndex(e => e.Nombre)
                .IsUnique();

            entity.Property(e => e.Descripcion)
                .HasColumnName("descripcion")
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(e => e.EsSistema)
                .HasColumnName("es_sistema")
                .IsRequired();

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .IsRequired();

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");
        });
    }

    private static void ConfigurePermisos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Permiso>(entity =>
        {
            entity.ToTable("permisos");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.Codigo)
                .HasColumnName("codigo")
                .HasMaxLength(120)
                .IsRequired();

            entity.HasIndex(e => e.Codigo)
                .IsUnique();

            entity.Property(e => e.Modulo)
                .HasColumnName("modulo")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.Accion)
                .HasColumnName("accion")
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(e => e.Descripcion)
                .HasColumnName("descripcion")
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .IsRequired();

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();
        });
    }

    private static void ConfigureRolesPermisos(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RolPermiso>(entity =>
        {
            entity.ToTable("roles_permisos");

            entity.HasKey(e => new { e.RolId, e.PermisoId });

            entity.Property(e => e.RolId)
                .HasColumnName("rol_id");

            entity.Property(e => e.PermisoId)
                .HasColumnName("permiso_id");

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.HasOne(e => e.Rol)
                .WithMany()
                .HasForeignKey(e => e.RolId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Permiso)
                .WithMany()
                .HasForeignKey(e => e.PermisoId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    private static void ConfigureUsuarios(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("usuarios");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.NombreCompleto)
                .HasColumnName("nombre_completo")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.Correo)
                .HasColumnName("correo")
                .HasMaxLength(180)
                .IsRequired();

            entity.HasIndex(e => e.Correo)
                .IsUnique();

            entity.Property(e => e.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(e => e.RolId)
                .HasColumnName("rol_id")
                .IsRequired();

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .IsRequired();

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");

            entity.Property(e => e.UltimoAccesoUtc)
                .HasColumnName("ultimo_acceso_utc");

            entity.HasOne(e => e.Rol)
                .WithMany()
                .HasForeignKey(e => e.RolId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureDependencias(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Dependencia>(entity =>
        {
            entity.ToTable("dependencias");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.Nombre)
                .HasColumnName("nombre")
                .HasMaxLength(180)
                .IsRequired();

            entity.HasIndex(e => e.Nombre)
                .IsUnique();

            entity.Property(e => e.Codigo)
                .HasColumnName("codigo")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(e => e.Codigo)
                .IsUnique();

            entity.Property(e => e.Responsable)
                .HasColumnName("responsable")
                .HasMaxLength(180);

            entity.Property(e => e.Correo)
                .HasColumnName("correo")
                .HasMaxLength(180);

            entity.Property(e => e.Activa)
                .HasColumnName("activa")
                .IsRequired();

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");
        });
    }

    private static void ConfigureFuncionarios(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Funcionario>(entity =>
        {
            entity.ToTable("funcionarios");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id");

            entity.Property(e => e.NombreCompleto)
                .HasColumnName("nombre_completo")
                .HasMaxLength(180)
                .IsRequired();

            entity.Property(e => e.Documento)
                .HasColumnName("documento")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(e => e.Documento)
                .IsUnique();

            entity.Property(e => e.Cargo)
                .HasColumnName("cargo")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(e => e.DependenciaId)
                .HasColumnName("dependencia_id")
                .IsRequired();

            entity.Property(e => e.Correo)
                .HasColumnName("correo")
                .HasMaxLength(180);

            entity.Property(e => e.Telefono)
                .HasColumnName("telefono")
                .HasMaxLength(60);

            entity.Property(e => e.Activo)
                .HasColumnName("activo")
                .IsRequired();

            entity.Property(e => e.FechaCreacionUtc)
                .HasColumnName("fecha_creacion_utc")
                .IsRequired();

            entity.Property(e => e.FechaActualizacionUtc)
                .HasColumnName("fecha_actualizacion_utc");

            entity.HasOne(e => e.Dependencia)
                .WithMany()
                .HasForeignKey(e => e.DependenciaId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void SeedAdministracion(ModelBuilder modelBuilder)
    {
        var seedDate = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var engineerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var assistantRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var funcionarioRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var consultaRoleId = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var administrativeAssistantRoleId = Guid.Parse("66666666-6666-6666-6666-666666666666");
        var financialSecretaryRoleId = Guid.Parse("77777777-7777-7777-7777-777777777777");
        var officeSecretaryRoleId = Guid.Parse("88888888-8888-8888-8888-888888888888");

        var dependenciaPlaneacionId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1");
        var dependenciaSistemasId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2");

        var adminUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        var coordinadorUserId = Guid.Parse("99999999-9999-9999-9999-999999999901");
        var tecnicoUserId = Guid.Parse("99999999-9999-9999-9999-999999999902");
        var almacenUserId = Guid.Parse("99999999-9999-9999-9999-999999999903");

        modelBuilder.Entity<Rol>().HasData(
            new
            {
                Id = adminRoleId,
                Nombre = "Administrador",
                Descripcion = "Acceso total al sistema SIGETIC.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = engineerRoleId,
                Nombre = "Administrador TIC",
                Descripcion = "Gestión técnica de inventario, mantenimientos, impresoras, consumibles y mesa de ayuda.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = assistantRoleId,
                Nombre = "Auxiliar de Sistemas",
                Descripcion = "Apoyo operativo en mantenimientos, tickets, impresoras y consumibles.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = funcionarioRoleId,
                Nombre = "Funcionario",
                Descripcion = "Usuario interno para creación y consulta de solicitudes.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = consultaRoleId,
                Nombre = "Consulta / Control Interno",
                Descripcion = "Acceso de solo consulta a reportes y trazabilidad.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = administrativeAssistantRoleId,
                Nombre = "Auxiliar Administrativo SAF",
                Descripcion = "Apoyo administrativo de la Secretaría Administrativa Financiera para consumibles, reportes y trazabilidad.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = financialSecretaryRoleId,
                Nombre = "Secretario Administrativo Financiero",
                Descripcion = "Acceso directivo de consulta, reportes, analítica, tickets y actualización de consumibles.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = officeSecretaryRoleId,
                Nombre = "Secretario de Despacho",
                Descripcion = "Acceso para visualizar dashboard y crear solicitudes en mesa de ayuda.",
                EsSistema = true,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            }
        );

        modelBuilder.Entity<Dependencia>().HasData(
            new
            {
                Id = dependenciaPlaneacionId,
                Nombre = "Secretaría de Planeación",
                Codigo = "PLA",
                Responsable = "Secretaría de Planeación",
                Correo = (string?)null,
                Activa = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            },
            new
            {
                Id = dependenciaSistemasId,
                Nombre = "Sistemas",
                Codigo = "SIS",
                Responsable = "Profesional TIC",
                Correo = (string?)null,
                Activa = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null
            }
        );

        modelBuilder.Entity<Usuario>().HasData(
            new
            {
                Id = adminUserId,
                NombreCompleto = "Administrador SIGETIC",
                Correo = "admin@sigetic.local",
                PasswordHash = PasswordHasher.HashWithFixedSaltForSeed("Admin123*"),
                RolId = adminRoleId,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null,
                UltimoAccesoUtc = (DateTime?)null
            },
            new
            {
                Id = coordinadorUserId,
                NombreCompleto = "Secretario Administrativo Financiero",
                Correo = "secretario.administrativo@sigetic.local",
                PasswordHash = PasswordHasher.HashWithFixedSaltForSeed("Sigetic123*"),
                RolId = financialSecretaryRoleId,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null,
                UltimoAccesoUtc = (DateTime?)null
            },
            new
            {
                Id = tecnicoUserId,
                NombreCompleto = "Administrador TIC",
                Correo = "administrador.tic@sigetic.local",
                PasswordHash = PasswordHasher.HashWithFixedSaltForSeed("Sigetic123*"),
                RolId = engineerRoleId,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null,
                UltimoAccesoUtc = (DateTime?)null
            },
            new
            {
                Id = almacenUserId,
                NombreCompleto = "Auxiliar Administrativo - Secretaría Administrativa Financiera",
                Correo = "auxiliar.administrativo@sigetic.local",
                PasswordHash = PasswordHasher.HashWithFixedSaltForSeed("Sigetic123*"),
                RolId = administrativeAssistantRoleId,
                Activo = true,
                FechaCreacionUtc = seedDate,
                FechaActualizacionUtc = (DateTime?)null,
                UltimoAccesoUtc = (DateTime?)null
            }
        );
    }
}
