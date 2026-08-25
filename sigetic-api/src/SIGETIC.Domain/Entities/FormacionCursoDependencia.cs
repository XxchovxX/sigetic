namespace SIGETIC.Domain.Entities;

public sealed class FormacionCursoDependencia
{
    private FormacionCursoDependencia()
    {
    }

    public FormacionCursoDependencia(Guid cursoId, Guid dependenciaId)
    {
        CursoId = cursoId;
        DependenciaId = dependenciaId;
    }

    public Guid CursoId { get; private set; }
    public Guid DependenciaId { get; private set; }
    public FormacionCurso? Curso { get; private set; }
    public Dependencia? Dependencia { get; private set; }
}
