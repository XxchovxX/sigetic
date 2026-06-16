"use client";

import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    CalendarDays,
    ClipboardList,
    Gauge,
    History,
    Search,
    Star,
    Wallet,
} from "lucide-react";
import {
    getAnaliticaResumen,
    getHistorialConsolidado,
    type AnaliticaResumen,
    type HistorialConsolidado,
} from "@/lib/analitica-api";

const currencyFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0);
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("es-CO").format(value || 0);
}

function getLevelClass(level: string) {
    const normalized = level.toLowerCase();

    if (normalized.includes("rojo")) return "bg-red-50 text-red-700";
    if (normalized.includes("amarillo")) return "bg-yellow-50 text-yellow-700";
    return "bg-green-50 text-[#006b2e]";
}

export default function AnaliticaPage() {
    const [data, setData] = useState<AnaliticaResumen | null>(null);
    const [historial, setHistorial] = useState<HistorialConsolidado | null>(null);
    const [codigo, setCodigo] = useState("");
    const [message, setMessage] = useState("");
    const [historyMessage, setHistoryMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setMessage("");
                setData(await getAnaliticaResumen());
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar la analítica."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    const maxConsumo = useMemo(() => {
        if (!data?.consumoPorDependencia.length) return 1;

        return Math.max(
            ...data.consumoPorDependencia.map(
                (item) =>
                    item.tickets +
                    item.mantenimientos +
                    item.consumibles
            ),
            1
        );
    }, [data]);

    async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!codigo.trim()) return;

        try {
            setIsSearching(true);
            setHistoryMessage("");
            setHistorial(await getHistorialConsolidado(codigo.trim()));
        } catch (error) {
            setHistorial(null);
            setHistoryMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible consultar el historial."
            );
        } finally {
            setIsSearching(false);
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-sm">
                Cargando analítica institucional...
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center text-sm font-bold text-red-700">
                {message || "No hay información de analítica disponible."}
            </div>
        );
    }

    const satisfaccion = data.satisfaccionTickets;
    const costoTotal = data.presupuestoConsumibles.reduce(
        (total, item) => total + item.costoEjecutado,
        0
    );

    return (
        <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={Star}
                    label="Satisfacción general"
                    value={`${satisfaccion.promedioGeneral.toFixed(1)} / 5`}
                    detail={`${satisfaccion.encuestas} encuestas`}
                />
                <MetricCard
                    icon={Wallet}
                    label="Consumibles ejecutados"
                    value={formatCurrency(costoTotal)}
                    detail="Costo acumulado registrado"
                />
                <MetricCard
                    icon={AlertTriangle}
                    label="Alertas de stock"
                    value={String(data.alertasStock.length)}
                    detail="Insumos bajo minimo"
                />
                <MetricCard
                    icon={CalendarDays}
                    label="Próximas revisiones"
                    value={String(data.calendario.length)}
                    detail="Mantenimientos programados"
                />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={BarChart3} eyebrow="Consumo" title="Carga por dependencia" />
                    {data.consumoPorDependencia.length === 0 ? (
                        <EmptyState text="Aun no hay movimientos suficientes para calcular consumo por dependencia." />
                    ) : (
                        <div className="space-y-3">
                            {data.consumoPorDependencia.map((item) => {
                                const total =
                                    item.tickets + item.mantenimientos + item.consumibles;

                                return (
                                    <div key={item.dependencia} className="rounded-xl bg-slate-50 p-4">
                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <h3 className="text-sm font-black text-[#14233b]">
                                                    {item.dependencia}
                                                </h3>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    {formatNumber(total)} registros | {formatCurrency(item.costoConsumibles)}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#006b2e]">
                                                {item.consumibles} consumibles
                                            </span>
                                        </div>
                                        <div className="mt-3 h-2 rounded-full bg-white">
                                            <div
                                                className="h-2 rounded-full bg-[#006b2e]"
                                                style={{ width: `${Math.max((total / maxConsumo) * 100, 8)}%` }}
                                            />
                                        </div>
                                        <div className="mt-3 grid gap-2 text-xs font-bold text-slate-600 md:grid-cols-3">
                                            <span>Tickets: {item.tickets}</span>
                                            <span>Mantenimientos: {item.mantenimientos}</span>
                                            <span>Consumibles: {item.consumibles}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <SectionTitle icon={Gauge} eyebrow="Encuestas" title="Calidad de atención" />
                    <div className="grid gap-3">
                        <ScoreRow label="Tiempo" value={satisfaccion.promedioTiempo} />
                        <ScoreRow label="Atención" value={satisfaccion.promedioAtencion} />
                        <ScoreRow label="Amabilidad" value={satisfaccion.promedioAmabilidad} />
                        <ScoreRow label="Solución" value={satisfaccion.promedioSolucion} />
                    </div>
                </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={Wallet} eyebrow="Presupuesto" title="Ejecución de consumibles" />
                    <CompactList
                        empty="No hay salidas valorizadas de consumibles."
                        items={data.presupuestoConsumibles.map((item) => ({
                            key: `${item.periodo}-${item.tipoConsumible}`,
                            title: `${item.periodo} | ${item.tipoConsumible}`,
                            detail: `${item.unidadesEjecutadas} unidades`,
                            value: formatCurrency(item.costoEjecutado),
                        }))}
                    />
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={AlertTriangle} eyebrow="Stock" title="Alertas y reposición" />
                    {data.alertasStock.length === 0 ? (
                        <EmptyState text="No hay consumibles por debajo del mínimo." />
                    ) : (
                        <div className="space-y-3">
                            {data.alertasStock.map((item) => (
                                <div key={item.consumibleId} className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
                                    <p className="text-sm font-black text-yellow-900">
                                        {item.codigoInterno} | {item.nombre}
                                    </p>
                                    <p className="mt-1 text-xs font-bold text-yellow-800">
                                        Stock {item.stockActual}/{item.stockMinimo}. Sugerido: {item.unidadesSugeridas}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={CalendarDays} eyebrow="Calendario" title="Próximas revisiones" />
                    <CompactList
                        empty="No hay revisiones programadas."
                        items={data.calendario.slice(0, 8).map((item) => ({
                            key: `${item.tipoActivo}-${item.codigo}-${item.fecha}`,
                            title: `${item.fecha} | ${item.codigo}`,
                            detail: `${item.tipoActivo} - ${item.tipoMantenimiento}`,
                            value: item.estado,
                        }))}
                    />
                </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={ClipboardList} eyebrow="Semáforo" title="Estado de activos" />
                    {data.semaforoActivos.length === 0 ? (
                        <EmptyState text="No hay activos registrados para semáforo." />
                    ) : (
                        <div className="space-y-2">
                            {data.semaforoActivos.slice(0, 10).map((item) => (
                                <div key={`${item.tipoActivo}-${item.codigo}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black text-[#14233b]">
                                            {item.codigo} | {item.nombre}
                                        </p>
                                        <p className="truncate text-xs font-bold text-slate-500">
                                            {item.dependencia}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getLevelClass(item.color)}`}>
                                        {item.estado}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={History} eyebrow="Historial" title="Trazabilidad consolidada" />
                    <form onSubmit={handleSearch} className="flex flex-col gap-3 md:flex-row">
                        <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                value={codigo}
                                onChange={(event) => setCodigo(event.target.value)}
                                placeholder="Código de equipo o impresora"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching}
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006b2e] px-5 text-sm font-black text-white disabled:opacity-70"
                        >
                            {isSearching ? "Buscando..." : "Consultar"}
                        </button>
                    </form>

                    {historyMessage ? (
                        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {historyMessage}
                        </div>
                    ) : null}

                    {historial ? (
                        <div className="mt-4 space-y-3">
                            <div className="rounded-xl bg-green-50 p-3">
                                <p className="text-sm font-black text-[#006b2e]">
                                    {historial.codigo} | {historial.nombre}
                                </p>
                                <p className="mt-1 text-xs font-bold text-slate-600">
                                    {historial.tipoActivo}
                                    {historial.dependencia ? ` | ${historial.dependencia}` : ""}
                                </p>
                            </div>
                            {historial.eventos.length === 0 ? (
                                <EmptyState text="No hay eventos asociados a este activo." />
                            ) : (
                                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                                    {historial.eventos.map((item, index) => (
                                        <div key={`${item.fecha}-${index}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                            <p className="text-xs font-black uppercase tracking-wide text-[#006b2e]">
                                                {item.fecha} | {item.tipo}
                                            </p>
                                            <p className="mt-1 text-sm font-black text-[#14233b]">
                                                {item.titulo}
                                            </p>
                                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                                {item.detalle}
                                            </p>
                                            <p className="mt-2 text-xs font-bold text-slate-500">
                                                Responsable: {item.responsable}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : null}
                </article>
            </section>
        </div>
    );
}

function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#14233b]">
                {value}
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p>
        </article>
    );
}

function SectionTitle({
    icon: Icon,
    eyebrow,
    title,
}: {
    icon: React.ElementType;
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#006b2e]">
                    {eyebrow}
                </p>
                <h2 className="text-lg font-black text-[#14233b]">{title}</h2>
            </div>
        </div>
    );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
    const percent = Math.min(Math.max((value / 5) * 100, 0), 100);

    return (
        <div>
            <div className="mb-1 flex justify-between text-xs font-black text-slate-600">
                <span>{label}</span>
                <span>{value.toFixed(1)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
                <div
                    className="h-2 rounded-full bg-[#006b2e]"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function CompactList({
    items,
    empty,
}: {
    items: { key: string; title: string; detail: string; value: string }[];
    empty: string;
}) {
    if (items.length === 0) {
        return <EmptyState text={empty} />;
    }

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.key} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#14233b]">
                                {item.title}
                            </p>
                            <p className="mt-1 truncate text-xs font-bold text-slate-500">
                                {item.detail}
                            </p>
                        </div>
                        <p className="shrink-0 text-right text-xs font-black text-[#006b2e]">
                            {item.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm font-bold text-slate-500">
            {text}
        </div>
    );
}
