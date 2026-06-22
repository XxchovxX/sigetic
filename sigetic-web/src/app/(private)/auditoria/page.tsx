"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Filter, History, Search, ShieldCheck } from "lucide-react";
import {
    getAuditoria,
    type AuditoriaRegistro,
} from "@/lib/auditoria-api";

const modules = [
    "",
    "Inventario TIC",
    "Impresoras",
    "Consumibles",
    "Mesa de ayuda",
    "Configuración",
    "Dependencias",
    "Funcionarios",
    "Sistema",
];

const actions = ["", "Creación", "Actualización", "Eliminación"];

export default function AuditoriaPage() {
    const [records, setRecords] = useState<AuditoriaRegistro[]>([]);
    const [moduleFilter, setModuleFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    const [userFilter, setUserFilter] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const filteredCount = records.length;
    const lastRecord = records[0];

    async function loadAudit() {
        setIsLoading(true);
        setError(null);

        try {
            const data = await getAuditoria({
                modulo: moduleFilter || undefined,
                accion: actionFilter || undefined,
                usuario: userFilter || undefined,
                take: 150,
            });

            setRecords(data);
        } catch (exception) {
            setError(
                exception instanceof Error
                    ? exception.message
                    : "No fue posible cargar la auditoría."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void loadAudit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const moduleSummary = useMemo(() => {
        return records.reduce<Record<string, number>>((summary, record) => {
            summary[record.modulo] = (summary[record.modulo] ?? 0) + 1;
            return summary;
        }, {});
    }, [records]);

    return (
        <div className="space-y-6">
            <section className="rounded-[1.7rem] bg-[#006b2e] p-6 text-white shadow-lg shadow-green-900/15">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                            Trazabilidad del sistema
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
                            Auditoría SIGETIC
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Consulta quién creó, actualizó o eliminó información dentro
                            del sistema, con fecha, módulo, ruta y resumen del cambio.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-white/70">
                            Último movimiento
                        </p>
                        <p className="mt-1 text-sm font-black">
                            {lastRecord
                                ? formatDate(lastRecord.fechaEventoUtc)
                                : "Sin registros aún"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    icon={History}
                    label="Eventos auditados"
                    value={filteredCount}
                    description="Registros cargados"
                />
                <MetricCard
                    icon={Activity}
                    label="Módulos con actividad"
                    value={Object.keys(moduleSummary).length}
                    description="Según filtros actuales"
                />
                <MetricCard
                    icon={ShieldCheck}
                    label="Alcance"
                    value="Global"
                    description="Altas, cambios y eliminaciones"
                />
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006b2e]">
                            Filtros
                        </p>
                        <h3 className="mt-1 text-2xl font-black text-[#14233b]">
                            Seguimiento de procesos
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadAudit()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00843d] px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:bg-[#006b2e]"
                    >
                        <Search className="h-4 w-4" />
                        Consultar
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                            Módulo
                        </span>
                        <select
                            value={moduleFilter}
                            onChange={(event) => setModuleFilter(event.target.value)}
                            className={inputClass}
                        >
                            {modules.map((module) => (
                                <option key={module || "todos"} value={module}>
                                    {module || "Todos"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                            Acción
                        </span>
                        <select
                            value={actionFilter}
                            onChange={(event) => setActionFilter(event.target.value)}
                            className={inputClass}
                        >
                            {actions.map((action) => (
                                <option key={action || "todas"} value={action}>
                                    {action || "Todas"}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wide text-slate-600">
                            Usuario
                        </span>
                        <input
                            value={userFilter}
                            onChange={(event) => setUserFilter(event.target.value)}
                            placeholder="Nombre o correo"
                            className={inputClass}
                        />
                    </label>
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <Filter className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                                Bitácora
                            </p>
                            <h3 className="text-xl font-black text-[#14233b]">
                                Últimos eventos registrados
                            </h3>
                        </div>
                    </div>
                </div>

                {error ? (
                    <div className="p-5 text-sm font-bold text-red-700">{error}</div>
                ) : isLoading ? (
                    <div className="p-8 text-center text-sm font-bold text-slate-500">
                        Cargando auditoría...
                    </div>
                ) : records.length === 0 ? (
                    <div className="p-8 text-center text-sm font-bold text-slate-500">
                        Aún no hay eventos con esos filtros.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Fecha</th>
                                    <th className="px-5 py-4">Usuario</th>
                                    <th className="px-5 py-4">Módulo</th>
                                    <th className="px-5 py-4">Acción</th>
                                    <th className="px-5 py-4">Entidad</th>
                                    <th className="px-5 py-4">Ruta</th>
                                    <th className="px-5 py-4">Resumen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.map((record) => (
                                    <tr key={record.id} className="align-top">
                                        <td className="px-5 py-4 font-bold text-slate-700">
                                            {formatDate(record.fechaEventoUtc)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-black text-[#14233b]">
                                                {record.usuario}
                                            </p>
                                            <p className="text-xs font-bold text-slate-500">
                                                {record.rol ?? "Sin rol"}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4 font-bold text-slate-700">
                                            {record.modulo}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#006b2e]">
                                                {record.accion}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-slate-600">
                                            <p className="font-bold">{record.entidad}</p>
                                            <p className="text-xs">{record.registroId}</p>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-bold text-slate-500">
                                            {record.metodoHttp} {record.ruta}
                                        </td>
                                        <td className="max-w-[360px] px-5 py-4 text-xs leading-6 text-slate-600">
                                            {record.resumen ?? "Sin detalle adicional."}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    description: string;
}) {
    return (
        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-black text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-[#14233b]">{value}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">{description}</p>
        </article>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#14233b] outline-none transition focus:border-[#00843d] focus:ring-4 focus:ring-green-100";
