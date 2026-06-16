namespace SIGETIC.Domain.Entities;

public sealed class RolPermiso
{
    private RolPermiso()
    {
    }

    public RolPermiso(Guid rolId, Guid permisoId)
    {
        RolId = rolId;
        PermisoId = permisoId;
        FechaCreacionUtc = DateTime.UtcNow;
    }

    public Guid RolId { get; private set; }

    public Guid PermisoId { get; private set; }

    public DateTime FechaCreacionUtc { get; private set; }

    public Rol? Rol { get; private set; }

    public Permiso? Permiso { get; private set; }
}