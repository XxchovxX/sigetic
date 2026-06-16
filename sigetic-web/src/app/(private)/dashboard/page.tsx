"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    AlertTriangle,
    BarChart3,
    Boxes,
    CheckCircle2,
    Computer,
    HelpCircle,
    LifeBuoy,
    Printer,
    Ticket,
} from "lucide-react";
import {
    getDashboardResumen,
    type DashboardActividad,
    type DashboardResumen,
} from "@/lib/dashboard-api";

const defaultResumen: DashboardResumen = {
    totalEquipos: 0,
    equiposActivos: 0,
    equiposEnMantenimiento: 0,
    totalImpresoras: 0,
    impresorasActivas: 0,
    consumiblesBajoStock: 0,
    ticketsAbiertos: 0,
    ticketsEnProceso: 0,
    ultimosMovimientosConsumibles: [],
    ultimosMantenimientos: [],
    ultimosTickets: [],
};

const quickActions = [
    {
        title: "Registrar equipo",
        description: "Crear hoja de vida de computador o activo TIC.",
        href: "/inventario/nuevo",
        icon: Computer,
    },
    {
        title: "Crear ticket",
        description: "Registrar solicitud de soporte técnico interno.",
        href: "/tickets/nuevo",
        icon: LifeBuoy,
    },
    {
        title: "Registrar consumible",
        description: "Controlar entradas, salidas y ajustes de stock.",
        href: "/consumibles/nuevo",
        icon: Boxes,
    },
    {
        title: "Generar reporte",
        description: "Consultar indicadores y exportaciones.",
        href: "/reportes",
        icon: BarChart3,
    },
];

export default function DashboardPage() {
    const [resumen, setResumen] = useState<DashboardResumen>(defaultResumen);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                setMessage("");
                setResumen(await getDashboardResumen());
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar el dashboard."
                );
            }
        }

        loadData();
    }, []);

    const stats = [
        {
            title: "Equipos registrados",
            value: resumen.totalEquipos,
            description: `${resumen.equiposActivos} activos · ${resumen.equiposEnMantenimiento} en mantenimiento`,
            icon: Computer,
        },
        {
            title: "Impresoras",
            value: resumen.totalImpresoras,
            description: `${resumen.impresorasActivas} activas`,
            icon: Printer,
        },
        {
            title: "Tickets abiertos",
            value: resumen.ticketsAbiertos,
            description: `${resumen.ticketsEnProceso} en proceso`,
            icon: Ticket,
        },
        {
            title: "Stock bajo",
            value: resumen.consumiblesBajoStock,
            description: "Consumibles por reponer",
            icon: AlertTriangle,
        },
    ];

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            San Carlos Avanza
                        </p>
                        <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.05em] md:text-4xl">
                            Control tecnológico institucional con trazabilidad y gestión
                            oportuna.
                        </h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80">
                            Administra inventario TIC, mesa de ayuda, consumibles,
                            funcionarios, dependencias y reportes desde una única plataforma.
                        </p>
                    </div>

                    <Link
                        href="/tickets/nuevo"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg transition hover:-translate-y-0.5"
                    >
                        Crear ticket
                        <HelpCircle className="h-4 w-4" />
                    </Link>
                </div>
            </section>

            {message ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-sm font-bold text-slate-500">{item.title}</p>
                            <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                                {item.value}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                        </article>
                    );
                })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <ActivityPanel
                    eyebrow="Trazabilidad"
                    title="Últimos movimientos de consumibles"
                    items={resumen.ultimosMovimientosConsumibles}
                    empty="Aún no hay movimientos de consumibles."
                />

                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Accesos rápidos
                        </p>
                        <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">
                            Operaciones frecuentes
                        </h3>
                    </div>

                    <div className="grid gap-3">
                        {quickActions.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link key={item.title} href={item.href} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-green-50">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{item.title}</p>
                                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <ActivityPanel
                    eyebrow="Mantenimientos"
                    title="Últimos mantenimientos"
                    items={resumen.ultimosMantenimientos}
                    empty="Aún no hay mantenimientos registrados."
                />
                <ActivityPanel
                    eyebrow="Mesa de ayuda"
                    title="Últimos tickets"
                    items={resumen.ultimosTickets}
                    empty="Mesa de ayuda queda preparada para el siguiente módulo."
                />
            </section>
        </div>
    );
}

function ActivityPanel({
    eyebrow,
    title,
    items,
    empty,
}: {
    eyebrow: string;
    title: string;
    items: DashboardActividad[];
    empty: string;
}) {
    return (
        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                    {eyebrow}
                </p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">
                    {title}
                </h3>
            </div>

            {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-sm font-bold text-slate-500">{empty}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={`${item.fecha}-${item.titulo}-${index}`} className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 md:grid-cols-[1fr_auto]">
                            <div>
                                <p className="text-xs font-black text-[#006b2e]">{item.fecha}</p>
                                <h4 className="mt-1 text-sm font-black text-slate-800">{item.titulo}</h4>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detalle}</p>
                            </div>
                            <span className="h-fit rounded-full bg-green-50 px-3 py-1 text-[11px] font-black text-[#006b2e]">
                                {item.estado}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </article>
    );
}
