namespace SIGETIC.Domain.Entities;

public sealed class FormacionCursoUsuario
{
    private FormacionCursoUsuario()
    {
    }

    public FormacionCursoUsuario(Guid cursoId, Guid usuarioId)
    {
        CursoId = cursoId;
        UsuarioId = usuarioId;
    }

    public Guid CursoId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public FormacionCurso? Curso { get; private set; }
    public Usuario? Usuario { get; private set; }
}
