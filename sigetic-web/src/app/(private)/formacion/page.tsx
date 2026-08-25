"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    Award,
    BookOpenCheck,
    CheckCircle2,
    ExternalLink,
    FileCheck2,
    GraduationCap,
    Link2,
    Loader2,
    Plus,
    Save,
    Search,
    ShieldCheck,
    X,
} from "lucide-react";
import { getStoredUser, SESSION_CHANGED_EVENT, type AuthUser } from "@/lib/auth";
import { canManageFormacion } from "@/lib/permissions";
import {
    createCursoFormacion,
    getCertificadoFormacion,
    getCursosFormacion,
    responderEvaluacionFormacion,
    type CrearCursoFormacionPayload,
    type FormacionCertificado,
    type FormacionCurso,
    type ResultadoFormacion,
} from "@/lib/formacion-api";

type MaterialForm = {
    titulo: string;
    tipo: string;
    url: string;
};

type PreguntaForm = {
    texto: string;
    explicacion: string;
    opciones: Array<{
        texto: string;
        esCorrecta: boolean;
    }>;
};

const emptyMaterial: MaterialForm = {
    titulo: "",
    tipo: "Video",
    url: "",
};

const emptyPregunta: PreguntaForm = {
    texto: "",
    explicacion: "",
    opciones: [
        { texto: "", esCorrecta: true },
        { texto: "", esCorrecta: false },
    ],
};

const initialCourseForm = {
    titulo: "",
    descripcion: "",
    categoria: "Inducción institucional",
    dirigidoA: "Funcionarios y contratistas",
    duracionMinutos: 30,
    puntajeMinimo: 80,
    activo: true,
    materiales: [emptyMaterial],
    preguntas: [emptyPregunta],
};

export default function FormacionPage() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [cursos, setCursos] = useState<FormacionCurso[]>([]);
    const [selectedCursoId, setSelectedCursoId] = useState("");
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [resultado, setResultado] = useState<ResultadoFormacion | null>(null);
    const [certificado, setCertificado] = useState<FormacionCertificado | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreator, setShowCreator] = useState(false);
    const [form, setForm] = useState(initialCourseForm);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const refreshUser = () => setUser(getStoredUser());

        refreshUser();
        window.addEventListener(SESSION_CHANGED_EVENT, refreshUser);
        window.addEventListener("storage", refreshUser);

        return () => {
            window.removeEventListener(SESSION_CHANGED_EVENT, refreshUser);
            window.removeEventListener("storage", refreshUser);
        };
    }, []);

    async function loadCursos() {
        try {
            setIsLoading(true);
            setError("");

            const data = await getCursosFormacion();
            setCursos(data);
            setSelectedCursoId((current) => current || data[0]?.id || "");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible cargar la formación institucional."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadCursos();
    }, []);

    const canManage = canManageFormacion(user);
    const selectedCurso = cursos.find((curso) => curso.id === selectedCursoId) ?? null;

    const filteredCursos = useMemo(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();

        return cursos.filter((curso) => {
            if (!normalizedTerm) return true;

            return `${curso.titulo} ${curso.descripcion} ${curso.categoria} ${curso.dirigidoA}`
                .toLowerCase()
                .includes(normalizedTerm);
        });
    }, [cursos, searchTerm]);

    const stats = useMemo(() => {
        const aprobados = cursos.filter((curso) => curso.ultimoIntento?.aprobado).length;
        const presentados = cursos.filter((curso) => curso.ultimoIntento).length;

        return [
            {
                title: "Cursos activos",
                value: cursos.filter((curso) => curso.activo).length,
                description: "Disponibles para el personal",
                icon: GraduationCap,
            },
            {
                title: "Presentados",
                value: presentados,
                description: "Evaluaciones realizadas",
                icon: BookOpenCheck,
            },
            {
                title: "Aprobados",
                value: aprobados,
                description: "Con certificado interno",
                icon: Award,
            },
            {
                title: "Pendientes",
                value: Math.max(cursos.length - aprobados, 0),
                description: "Por completar o reforzar",
                icon: FileCheck2,
            },
        ];
    }, [cursos]);

    function resetEvaluation(cursoId: string) {
        setSelectedCursoId(cursoId);
        setAnswers({});
        setResultado(null);
        setCertificado(null);
        setMessage("");
        setError("");
    }

    function updateMaterial(index: number, key: keyof MaterialForm, value: string) {
        setForm((current) => ({
            ...current,
            materiales: current.materiales.map((material, materialIndex) =>
                materialIndex === index ? { ...material, [key]: value } : material
            ),
        }));
    }

    function updatePregunta(index: number, key: keyof PreguntaForm, value: string) {
        setForm((current) => ({
            ...current,
            preguntas: current.preguntas.map((pregunta, preguntaIndex) =>
                preguntaIndex === index ? { ...pregunta, [key]: value } : pregunta
            ),
        }));
    }

    function updateOpcion(
        preguntaIndex: number,
        opcionIndex: number,
        value: string
    ) {
        setForm((current) => ({
            ...current,
            preguntas: current.preguntas.map((pregunta, currentPreguntaIndex) =>
                currentPreguntaIndex === preguntaIndex
                    ? {
                        ...pregunta,
                        opciones: pregunta.opciones.map((opcion, currentOpcionIndex) =>
                            currentOpcionIndex === opcionIndex
                                ? { ...opcion, texto: value }
                                : opcion
                        ),
                    }
                    : pregunta
            ),
        }));
    }

    function setCorrectOption(preguntaIndex: number, opcionIndex: number) {
        setForm((current) => ({
            ...current,
            preguntas: current.preguntas.map((pregunta, currentPreguntaIndex) =>
                currentPreguntaIndex === preguntaIndex
                    ? {
                        ...pregunta,
                        opciones: pregunta.opciones.map((opcion, currentOpcionIndex) => ({
                            ...opcion,
                            esCorrecta: currentOpcionIndex === opcionIndex,
                        })),
                    }
                    : pregunta
            ),
        }));
    }

    function buildPayload(): CrearCursoFormacionPayload {
        return {
            titulo: form.titulo.trim(),
            descripcion: form.descripcion.trim(),
            categoria: form.categoria.trim(),
            dirigidoA: form.dirigidoA.trim(),
            duracionMinutos: Number(form.duracionMinutos),
            puntajeMinimo: Number(form.puntajeMinimo),
            activo: form.activo,
            materiales: form.materiales.map((material, index) => ({
                titulo: material.titulo.trim(),
                tipo: material.tipo.trim(),
                url: material.url.trim(),
                orden: index + 1,
            })),
            preguntas: form.preguntas.map((pregunta, index) => ({
                texto: pregunta.texto.trim(),
                explicacion: pregunta.explicacion.trim() || null,
                orden: index + 1,
                opciones: pregunta.opciones.map((opcion, optionIndex) => ({
                    texto: opcion.texto.trim(),
                    esCorrecta: opcion.esCorrecta,
                    orden: optionIndex + 1,
                })),
            })),
        };
    }

    async function handleCreateCourse(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canManage) {
            setError("Tu rol no tiene permisos para gestionar formación.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            const created = await createCursoFormacion(buildPayload());
            setMessage("Curso de formación creado correctamente.");
            setForm(initialCourseForm);
            setShowCreator(false);
            await loadCursos();
            resetEvaluation(created.id);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible crear el curso de formación."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleSubmitEvaluation(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!selectedCurso) return;

        const missingAnswer = selectedCurso.preguntas.some(
            (pregunta) => !answers[pregunta.id]
        );

        if (missingAnswer) {
            setError("Responde todas las preguntas antes de enviar la evaluación.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            setMessage("");

            const result = await responderEvaluacionFormacion(selectedCurso.id, {
                respuestas: selectedCurso.preguntas.map((pregunta) => ({
                    preguntaId: pregunta.id,
                    opcionId: answers[pregunta.id],
                })),
            });

            setResultado(result);

            if (result.aprobado) {
                const certificadoData = await getCertificadoFormacion(result.intentoId);
                setCertificado(certificadoData);
            } else {
                setCertificado(null);
            }

            setMessage(
                result.aprobado
                    ? "Evaluación aprobada. El certificado interno quedó generado."
                    : "Evaluación presentada. Debes reforzar el contenido y volver a intentar."
            );
            await loadCursos();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible presentar la evaluación."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article
                            key={item.title}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-500">
                                    FOR
                                </span>
                            </div>
                            <p className="mt-5 text-sm font-black text-slate-500">
                                {item.title}
                            </p>
                            <p className="mt-2 text-3xl font-black text-[#14233b]">
                                {item.value}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {item.description}
                            </p>
                        </article>
                    );
                })}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006b2e]">
                            formación institucional
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-[#14233b]">
                            Capacitaciones, evaluaciones y certificados
                        </h2>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            Publica materiales, valida aprendizaje con preguntas y deja
                            constancia interna de aprobación para funcionarios y contratistas.
                        </p>
                    </div>

                    {canManage ? (
                        <button
                            type="button"
                            onClick={() => setShowCreator((current) => !current)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#006b2e] px-4 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-[#0b8f3a]"
                        >
                            {showCreator ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            {showCreator ? "Cerrar creador" : "Crear curso"}
                        </button>
                    ) : null}
                </div>

                {message ? (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                        <CheckCircle2 className="h-4 w-4" />
                        {message}
                    </div>
                ) : null}

                {error ? (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {error}
                    </div>
                ) : null}
            </section>

            {showCreator && canManage ? (
                <form
                    onSubmit={handleCreateCourse}
                    className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-[#14233b]">
                                Nuevo curso de formación
                            </h3>
                            <p className="text-sm text-slate-500">
                                Define material, preguntas y respuesta correcta.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Input
                            label="Título"
                            value={form.titulo}
                            onChange={(value) => setForm({ ...form, titulo: value })}
                            placeholder="Ej: Inducción de seguridad informática"
                            required
                        />
                        <Input
                            label="Categoría"
                            value={form.categoria}
                            onChange={(value) => setForm({ ...form, categoria: value })}
                            required
                        />
                        <Input
                            label="Dirigido a"
                            value={form.dirigidoA}
                            onChange={(value) => setForm({ ...form, dirigidoA: value })}
                            required
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Input
                                label="Duración estimada"
                                type="number"
                                value={String(form.duracionMinutos)}
                                onChange={(value) =>
                                    setForm({ ...form, duracionMinutos: Number(value) })
                                }
                                min={1}
                                required
                            />
                            <Input
                                label="Puntaje mínimo"
                                type="number"
                                value={String(form.puntajeMinimo)}
                                onChange={(value) =>
                                    setForm({ ...form, puntajeMinimo: Number(value) })
                                }
                                min={1}
                                max={100}
                                required
                            />
                        </div>
                    </div>

                    <label className="block">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                            Descripción
                        </span>
                        <textarea
                            value={form.descripcion}
                            onChange={(event) =>
                                setForm({ ...form, descripcion: event.target.value })
                            }
                            rows={3}
                            required
                            className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                            placeholder="Describe el objetivo de la capacitación."
                        />
                    </label>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-black uppercase tracking-wide text-slate-600">
                                Materiales
                            </h4>
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        materiales: [...current.materiales, { ...emptyMaterial }],
                                    }))
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-green-50 hover:text-[#006b2e]"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar material
                            </button>
                        </div>

                        {form.materiales.map((material, index) => (
                            <div
                                key={`material-${index}`}
                                className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:grid-cols-[1fr_10rem_1.5fr]"
                            >
                                <Input
                                    label="Título del material"
                                    value={material.titulo}
                                    onChange={(value) => updateMaterial(index, "titulo", value)}
                                    required
                                />
                                <Select
                                    label="Tipo"
                                    value={material.tipo}
                                    onChange={(value) => updateMaterial(index, "tipo", value)}
                                    options={["Video", "Documento", "Enlace", "Presentación"]}
                                />
                                <Input
                                    label="URL"
                                    value={material.url}
                                    onChange={(value) => updateMaterial(index, "url", value)}
                                    placeholder="https://www.youtube.com/..."
                                    required
                                />
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-black uppercase tracking-wide text-slate-600">
                                Evaluación
                            </h4>
                            <button
                                type="button"
                                onClick={() =>
                                    setForm((current) => ({
                                        ...current,
                                        preguntas: [
                                            ...current.preguntas,
                                            {
                                                ...emptyPregunta,
                                                opciones: emptyPregunta.opciones.map((opcion) => ({
                                                    ...opcion,
                                                })),
                                            },
                                        ],
                                    }))
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 hover:bg-green-50 hover:text-[#006b2e]"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar pregunta
                            </button>
                        </div>

                        {form.preguntas.map((pregunta, preguntaIndex) => (
                            <div
                                key={`pregunta-${preguntaIndex}`}
                                className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                                <Input
                                    label={`Pregunta ${preguntaIndex + 1}`}
                                    value={pregunta.texto}
                                    onChange={(value) =>
                                        updatePregunta(preguntaIndex, "texto", value)
                                    }
                                    required
                                />
                                <Input
                                    label="Retroalimentación"
                                    value={pregunta.explicacion}
                                    onChange={(value) =>
                                        updatePregunta(preguntaIndex, "explicacion", value)
                                    }
                                    placeholder="Explica brevemente la respuesta correcta."
                                />
                                <div className="grid gap-3 md:grid-cols-2">
                                    {pregunta.opciones.map((opcion, opcionIndex) => (
                                        <label
                                            key={`opcion-${preguntaIndex}-${opcionIndex}`}
                                            className="rounded-2xl border border-slate-200 bg-white p-3"
                                        >
                                            <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                                                Opción {opcionIndex + 1}
                                            </span>
                                            <input
                                                value={opcion.texto}
                                                onChange={(event) =>
                                                    updateOpcion(
                                                        preguntaIndex,
                                                        opcionIndex,
                                                        event.target.value
                                                    )
                                                }
                                                required
                                                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setCorrectOption(preguntaIndex, opcionIndex)
                                                }
                                                className={`mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${
                                                    opcion.esCorrecta
                                                        ? "bg-green-50 text-[#006b2e]"
                                                        : "bg-slate-100 text-slate-500"
                                                }`}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Correcta
                                            </button>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#006b2e] px-5 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-[#0b8f3a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        Guardar curso
                    </button>
                </form>
            ) : null}

            <section className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar curso o categoría..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>

                    <div className="mt-4 space-y-3">
                        {isLoading ? (
                            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando formación...
                            </div>
                        ) : filteredCursos.length > 0 ? (
                            filteredCursos.map((curso) => (
                                <button
                                    key={curso.id}
                                    type="button"
                                    onClick={() => resetEvaluation(curso.id)}
                                    className={`w-full rounded-2xl border p-4 text-left transition ${
                                        selectedCursoId === curso.id
                                            ? "border-green-200 bg-green-50"
                                            : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-black text-[#14233b]">
                                                {curso.titulo}
                                            </h3>
                                            <p className="mt-1 text-xs font-bold text-slate-500">
                                                {curso.categoria} · {curso.duracionMinutos} min
                                            </p>
                                        </div>
                                        {curso.ultimoIntento?.aprobado ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-[#006b2e]">
                                                Aprobado
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-600">
                                        {curso.descripcion}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                Aún no hay cursos de formación publicados.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {selectedCurso ? (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006b2e]">
                                        {selectedCurso.categoria}
                                    </p>
                                    <h2 className="mt-2 text-2xl font-black text-[#14233b]">
                                        {selectedCurso.titulo}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                        {selectedCurso.descripcion}
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600">
                                    Mínimo {selectedCurso.puntajeMinimo}%
                                </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-3">
                                <InfoPill label="Dirigido a" value={selectedCurso.dirigidoA} />
                                <InfoPill
                                    label="Duración"
                                    value={`${selectedCurso.duracionMinutos} minutos`}
                                />
                                <InfoPill
                                    label="Preguntas"
                                    value={String(selectedCurso.preguntas.length)}
                                />
                            </div>

                            <div>
                                <h3 className="text-lg font-black text-[#14233b]">
                                    Material de estudio
                                </h3>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    {selectedCurso.materiales.map((material) => (
                                        <a
                                            key={material.id}
                                            href={material.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-green-50"
                                        >
                                            <span className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                                    <Link2 className="h-4 w-4" />
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-black text-[#14233b]">
                                                        {material.titulo}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {material.tipo}
                                                    </span>
                                                </span>
                                            </span>
                                            <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmitEvaluation} className="space-y-4">
                                <h3 className="text-lg font-black text-[#14233b]">
                                    Evaluación de aprobación
                                </h3>
                                {selectedCurso.preguntas.map((pregunta, index) => (
                                    <div
                                        key={pregunta.id}
                                        className="rounded-2xl border border-slate-200 p-4"
                                    >
                                        <p className="text-sm font-black text-[#14233b]">
                                            {index + 1}. {pregunta.texto}
                                        </p>
                                        <div className="mt-3 grid gap-2">
                                            {pregunta.opciones.map((opcion) => (
                                                <label
                                                    key={opcion.id}
                                                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                                                        answers[pregunta.id] === opcion.id
                                                            ? "border-green-200 bg-green-50 text-[#006b2e]"
                                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={pregunta.id}
                                                        value={opcion.id}
                                                        checked={answers[pregunta.id] === opcion.id}
                                                        onChange={() =>
                                                            setAnswers((current) => ({
                                                                ...current,
                                                                [pregunta.id]: opcion.id,
                                                            }))
                                                        }
                                                        className="h-4 w-4 accent-[#006b2e]"
                                                    />
                                                    {opcion.texto}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#006b2e] px-5 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-[#0b8f3a] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FileCheck2 className="h-4 w-4" />
                                    )}
                                    Enviar evaluación
                                </button>
                            </form>

                            {resultado ? (
                                <div
                                    className={`rounded-2xl border p-5 ${
                                        resultado.aprobado
                                            ? "border-green-100 bg-green-50"
                                            : "border-yellow-100 bg-yellow-50"
                                    }`}
                                >
                                    <h3 className="text-lg font-black text-[#14233b]">
                                        Resultado: {Math.round(resultado.puntaje)}%
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-600">
                                        {resultado.respuestasCorrectas} de{" "}
                                        {resultado.totalPreguntas} respuestas correctas.
                                    </p>
                                </div>
                            ) : null}

                            {certificado ? (
                                <Certificate certificado={certificado} user={user} />
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex min-h-[24rem] flex-col items-center justify-center text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <h2 className="mt-4 text-xl font-black text-[#14233b]">
                                No hay formación para mostrar
                            </h2>
                            <p className="mt-2 max-w-md text-sm text-slate-500">
                                Cuando se cree el primer curso, aparecerá aquí para que el
                                personal pueda revisarlo y presentar la evaluación.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

function Input({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    min,
    max,
    required,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    min?: number;
    max?: number;
    required?: boolean;
}) {
    return (
        <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            <input
                type={type}
                value={value}
                min={min}
                max={max}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                required={required}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
            />
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}) {
    return (
        <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
            >
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}

function InfoPill({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 text-sm font-black text-[#14233b]">{value}</p>
        </div>
    );
}

function Certificate({
    certificado,
    user,
}: {
    certificado: FormacionCertificado;
    user: AuthUser | null;
}) {
    return (
        <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Award className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#14233b]">
                            Certificado interno generado
                        </h3>
                        <p className="text-sm text-slate-500">
                            Código de verificación: {certificado.codigoCertificado}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:bg-green-50 hover:text-[#006b2e]"
                >
                    <FileCheck2 className="h-4 w-4" />
                    Imprimir
                </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-6 text-center">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#006b2e]">
                    Alcaldía Municipal de San Carlos de Guaroa
                </p>
                <h4 className="mt-4 text-2xl font-black text-[#14233b]">
                    Constancia de aprobación
                </h4>
                <p className="mt-5 text-sm leading-6 text-slate-600">
                    Se deja constancia de que{" "}
                    <strong>{certificado.participanteNombre || user?.nombreCompleto}</strong>{" "}
                    aprobó la capacitación <strong>{certificado.cursoTitulo}</strong> con
                    puntaje de <strong>{Math.round(certificado.puntaje)}%</strong>.
                </p>
                <div className="mt-5 grid gap-3 text-left md:grid-cols-3">
                    <InfoPill
                        label="Fecha"
                        value={formatDateTime(certificado.fechaPresentacionUtc)}
                    />
                    <InfoPill label="Categoría" value={certificado.categoria} />
                    <InfoPill
                        label="Duración"
                        value={`${certificado.duracionMinutos} minutos`}
                    />
                </div>
                <p className="mt-5 text-xs font-bold text-slate-500">
                    Documento generado por SIGETIC para control interno institucional.
                </p>
            </div>
        </div>
    );
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
