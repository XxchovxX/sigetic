"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
    AlertTriangle,
    BellRing,
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    Mail,
    Printer,
    RefreshCcw,
    Save,
    Search,
    XCircle,
} from "lucide-react";
import { getEquipos, type Equipo } from "@/lib/api";
import { getImpresoras, type Impresora } from "@/lib/impresoras-api";
import {
    cancelarProgramacionMantenimiento,
    createProgramacionMantenimiento,
    enviarRecordatoriosMantenimiento,
    getProgramacionesMantenimiento,
    marcarProgramacionEjecutada,
    type ProgramacionMantenimiento,
} from "@/lib/programacion-api";
import { getStoredUser } from "@/lib/auth";
import { canManageTechnicalAssets } from "@/lib/permissions";

const technicianName = "Carlos Marin";
const technicianEmail = "cmarinv2005@gmail.com";

const initialForm = {
    tipoActivo: "Equipo" as "Equipo" | "Impresora",
    activoId: "",
    tipoMantenimiento: "Preventivo",
    fechaProgramada: new Date().toISOString().slice(0, 10),
    horaProgramada: "08:00",
    frecuencia: "Trimestral",
    tecnicoResponsable: technicianName,
    correoTecnico: technicianEmail,
    observaciones: "",
};

const estadoClasses: Record<string, string> = {
    Programado: "bg-blue-50 text-blue-700",
    Notificado: "bg-yellow-50 text-yellow-700",
    Ejecutado: "bg-green-50 text-[#006b2e]",
    Vencido: "bg-red-50 text-red-700",
    Cancelado: "bg-slate-100 text-slate-600",
};

export default function ProgramacionMantenimientosPage() {
    const canManage = canManageTechnicalAssets(getStoredUser());
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [impresoras, setImpresoras] = useState<Impresora[]>([]);
    const [programaciones, setProgramaciones] = useState<ProgramacionMantenimiento[]>([]);
    const [form, setForm] = useState(initialForm);
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("Todos");
    const [tipoFilter, setTipoFilter] = useState("Todos");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function loadData() {
        try {
            setIsLoading(true);
            setError("");

            const [equiposData, impresorasData, programacionesData] =
                await Promise.all([
                    getEquipos(),
                    getImpresoras(),
                    getProgramacionesMantenimiento(),
                ]);

            setEquipos(equiposData);
            setImpresoras(impresorasData);
            setProgramaciones(programacionesData);

            if (!form.activoId) {
                const firstAsset = form.tipoActivo === "Equipo"
                    ? equiposData[0]?.id
                    : impresorasData[0]?.id;

                if (firstAsset) {
                    setForm((current) => ({ ...current, activoId: firstAsset }));
                }
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible cargar la programacion de mantenimientos."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const assetOptions = form.tipoActivo === "Equipo"
        ? equipos.map((item) => ({
            id: item.id,
            label: `${item.codigoInterno} - ${item.marca} ${item.modelo}`,
        }))
        : impresoras.map((item) => ({
            id: item.id,
            label: `${item.codigoInterno} - ${item.marca} ${item.modelo}`,
        }));

    const filteredProgramaciones = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return programaciones.filter((item) => {
            const matchesSearch = !normalizedSearch ||
                item.codigoActivo.toLowerCase().includes(normalizedSearch) ||
                item.nombreActivo.toLowerCase().includes(normalizedSearch) ||
                item.tecnicoResponsable.toLowerCase().includes(normalizedSearch);
            const matchesEstado = estadoFilter === "Todos" || item.estado === estadoFilter;
            const matchesTipo = tipoFilter === "Todos" || item.tipoActivo === tipoFilter;

            return matchesSearch && matchesEstado && matchesTipo;
        });
    }, [programaciones, searchTerm, estadoFilter, tipoFilter]);

    const summary = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekText = nextWeek.toISOString().slice(0, 10);

        return [
            {
                title: "Programados",
                value: programaciones.filter((item) => item.estado === "Programado").length,
                description: "Pendientes por ejecutar",
                icon: CalendarClock,
            },
            {
                title: "Proximos 7 dias",
                value: programaciones.filter((item) =>
                    item.fechaProgramada >= today &&
                    item.fechaProgramada <= nextWeekText &&
                    item.estado !== "Ejecutado" &&
                    item.estado !== "Cancelado"
                ).length,
                description: "Mantenimientos cercanos",
                icon: BellRing,
            },
            {
                title: "Vencidos",
                value: programaciones.filter((item) => item.estado === "Vencido").length,
                description: "Requieren atencion",
                icon: AlertTriangle,
            },
            {
                title: "Ejecutados",
                value: programaciones.filter((item) => item.estado === "Ejecutado").length,
                description: "Cerrados en agenda",
                icon: ClipboardCheck,
            },
        ];
    }, [programaciones]);

    function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
        setForm((current) => ({
            ...current,
            [key]: value,
            ...(key === "tipoActivo"
                ? {
                    activoId: value === "Equipo"
                        ? equipos[0]?.id ?? ""
                        : impresoras[0]?.id ?? "",
                }
                : {}),
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!canManage) {
            setError("Tu rol no tiene permisos para crear programaciones.");
            return;
        }

        if (!form.activoId) {
            setError("Selecciona un equipo o impresora para programar el mantenimiento.");
            return;
        }

        try {
            setIsSaving(true);
            setError("");
            setMessage("");

            await createProgramacionMantenimiento({
                tipoActivo: form.tipoActivo,
                equipoId: form.tipoActivo === "Equipo" ? form.activoId : null,
                impresoraId: form.tipoActivo === "Impresora" ? form.activoId : null,
                tipoMantenimiento: form.tipoMantenimiento,
                fechaProgramada: form.fechaProgramada,
                horaProgramada: form.horaProgramada || null,
                frecuencia: form.frecuencia,
                tecnicoResponsable: form.tecnicoResponsable,
                correoTecnico: form.correoTecnico || null,
                observaciones: form.observaciones || null,
            });

            setMessage("Mantenimiento preventivo programado correctamente.");
            setForm((current) => ({
                ...initialForm,
                tipoActivo: current.tipoActivo,
                activoId: current.activoId,
            }));
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible guardar la programacion."
            );
        } finally {
            setIsSaving(false);
        }
    }

    async function handleRecordatorios() {
        try {
            setError("");
            setMessage("");

            const result = await enviarRecordatoriosMantenimiento(3);
            setMessage(
                result.totalNotificados === 0
                    ? "No hay mantenimientos pendientes para notificar hoy."
                    : `Se enviaron ${result.totalNotificados} recordatorio(s) de mantenimiento.`
            );
            await loadData();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No fue posible enviar los recordatorios."
            );
        }
    }

    async function handleEjecutar(id: string) {
        await marcarProgramacionEjecutada(id);
        setMessage("Programacion marcada como ejecutada.");
        await loadData();
    }

    async function handleCancelar(id: string) {
        await cancelarProgramacionMantenimiento(id);
        setMessage("Programacion cancelada.");
        await loadData();
    }

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summary.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article
                            key={item.title}
                            className="rounded-[1.3rem] border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">{item.title}</p>
                            <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#14233b]">
                                {item.value}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </article>
                    );
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <form
                    onSubmit={handleSubmit}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <div className="mb-5 flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                                Programador preventivo
                            </p>
                            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#14233b]">
                                Agendar mantenimiento
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-slate-500">
                                Programa mantenimientos de equipos TIC e impresoras y notifica al tecnico responsable.
                            </p>
                        </div>
                    </div>

                    {message ? (
                        <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                            {message}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tipo de activo">
                            <select
                                value={form.tipoActivo}
                                onChange={(event) =>
                                    updateForm("tipoActivo", event.target.value as "Equipo" | "Impresora")
                                }
                                className={inputClass}
                                disabled={!canManage}
                            >
                                <option value="Equipo">Equipo TIC</option>
                                <option value="Impresora">Impresora</option>
                            </select>
                        </Field>

                        <Field label="Activo">
                            <select
                                value={form.activoId}
                                onChange={(event) => updateForm("activoId", event.target.value)}
                                className={inputClass}
                                disabled={!canManage || assetOptions.length === 0}
                            >
                                {assetOptions.length === 0 ? (
                                    <option value="">Sin activos disponibles</option>
                                ) : (
                                    assetOptions.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </Field>

                        <Field label="Fecha programada">
                            <input
                                type="date"
                                value={form.fechaProgramada}
                                onChange={(event) => updateForm("fechaProgramada", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            />
                        </Field>

                        <Field label="Hora">
                            <input
                                type="time"
                                value={form.horaProgramada}
                                onChange={(event) => updateForm("horaProgramada", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            />
                        </Field>

                        <Field label="Frecuencia">
                            <select
                                value={form.frecuencia}
                                onChange={(event) => updateForm("frecuencia", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            >
                                <option>Unico</option>
                                <option>Mensual</option>
                                <option>Trimestral</option>
                                <option>Semestral</option>
                                <option>Anual</option>
                            </select>
                        </Field>

                        <Field label="Tipo de mantenimiento">
                            <select
                                value={form.tipoMantenimiento}
                                onChange={(event) => updateForm("tipoMantenimiento", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            >
                                <option>Preventivo</option>
                                <option>Correctivo programado</option>
                            </select>
                        </Field>

                        <Field label="Tecnico responsable">
                            <input
                                value={form.tecnicoResponsable}
                                onChange={(event) => updateForm("tecnicoResponsable", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            />
                        </Field>

                        <Field label="Correo tecnico">
                            <input
                                type="email"
                                value={form.correoTecnico}
                                onChange={(event) => updateForm("correoTecnico", event.target.value)}
                                className={inputClass}
                                disabled={!canManage}
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Observaciones">
                                <textarea
                                    value={form.observaciones}
                                    onChange={(event) => updateForm("observaciones", event.target.value)}
                                    className={`${inputClass} min-h-24 resize-y py-3`}
                                    placeholder="Ej: limpieza interna, revision de actualizaciones, prueba de impresion..."
                                    disabled={!canManage}
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={!canManage || isSaving || assetOptions.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#087f32] px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-800/20 transition hover:bg-[#006b2e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Guardando..." : "Guardar programacion"}
                        </button>

                        <button
                            type="button"
                            onClick={handleRecordatorios}
                            disabled={!canManage}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Mail className="h-4 w-4" />
                            Enviar recordatorios
                        </button>
                    </div>
                </form>

                <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                                Calendario operativo
                            </p>
                            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#14233b]">
                                Mantenimientos programados
                            </h2>
                        </div>

                        <button
                            type="button"
                            onClick={loadData}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Actualizar
                        </button>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <label className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Buscar por codigo, activo o tecnico..."
                                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </label>

                        <select
                            value={estadoFilter}
                            onChange={(event) => setEstadoFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option>Todos</option>
                            <option>Programado</option>
                            <option>Notificado</option>
                            <option>Vencido</option>
                            <option>Ejecutado</option>
                            <option>Cancelado</option>
                        </select>

                        <select
                            value={tipoFilter}
                            onChange={(event) => setTipoFilter(event.target.value)}
                            className={inputClass}
                        >
                            <option>Todos</option>
                            <option>Equipo</option>
                            <option>Impresora</option>
                        </select>
                    </div>

                    <div className="mt-5 space-y-3">
                        {isLoading ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-500">
                                Cargando programacion...
                            </div>
                        ) : filteredProgramaciones.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                                <CalendarClock className="mx-auto h-10 w-10 text-slate-300" />
                                <p className="mt-3 text-base font-black text-[#14233b]">
                                    No hay mantenimientos programados
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Crea la primera agenda preventiva para equipos o impresoras.
                                </p>
                            </div>
                        ) : (
                            filteredProgramaciones.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-2xl border border-slate-200 p-4"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                                {item.tipoActivo === "Impresora" ? (
                                                    <Printer className="h-5 w-5" />
                                                ) : (
                                                    <CalendarClock className="h-5 w-5" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-base font-black text-[#14233b]">
                                                        {item.codigoActivo} - {item.nombreActivo}
                                                    </h3>
                                                    <span className={`rounded-full px-3 py-1 text-xs font-black ${estadoClasses[item.estado] ?? "bg-slate-100 text-slate-600"}`}>
                                                        {item.estado}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.tipoActivo} · {item.tipoMantenimiento} · {item.frecuencia}
                                                </p>

                                                <p className="mt-2 text-sm font-bold text-slate-700">
                                                    {item.fechaProgramada}
                                                    {item.horaProgramada ? ` · ${item.horaProgramada.slice(0, 5)}` : ""}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Responsable: {item.tecnicoResponsable}
                                                    {item.correoTecnico ? ` · ${item.correoTecnico}` : ""}
                                                </p>

                                                {item.observaciones ? (
                                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                                        {item.observaciones}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>

                                        {canManage ? (
                                            <div className="flex shrink-0 flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEjecutar(item.id)}
                                                    disabled={item.estado === "Ejecutado" || item.estado === "Cancelado"}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-black text-[#006b2e] transition hover:bg-green-100 disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Ejecutado
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelar(item.id)}
                                                    disabled={item.estado === "Ejecutado" || item.estado === "Cancelado"}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                    Cancelar
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </article>
                            ))
                        )}
                    </div>
                </section>
            </section>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            {children}
        </label>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-[#14233b] outline-none shadow-sm transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
