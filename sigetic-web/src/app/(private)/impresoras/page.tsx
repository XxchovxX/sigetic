"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    Eye,
    Filter,
    Plus,
    Printer,
    Search,
    ServerCrash,
    Wifi,
    Wrench,
} from "lucide-react";
import { getImpresoras, type Impresora } from "@/lib/impresoras-api";
import { getStoredUser } from "@/lib/auth";
import { canManageTechnicalAssets } from "@/lib/permissions";

export default function ImpresorasPage() {
    const canManageTechnical = canManageTechnicalAssets(getStoredUser());
    const [impresoras, setImpresoras] = useState<Impresora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");

    async function loadImpresoras() {
        try {
            setIsLoading(true);
            setMessage("");

            const data = await getImpresoras();
            setImpresoras(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar las impresoras."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadImpresoras();
    }, []);

    const filteredImpresoras = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        return impresoras.filter((item) => {
            const matchesSearch =
                !normalizedSearch ||
                [
                    item.codigoInterno,
                    item.marca,
                    item.modelo,
                    item.serial,
                    item.dependencia,
                    item.direccionIp ?? "",
                    item.estado,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "Todos" || item.estado === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [impresoras, searchTerm, statusFilter]);

    const stats = useMemo(() => {
        const total = impresoras.length;
        const activas = impresoras.filter((item) =>
            item.estado.toLowerCase().includes("activo")
        ).length;
        const mantenimiento = impresoras.filter((item) =>
            item.estado.toLowerCase().includes("mantenimiento")
        ).length;
        const red = impresoras.filter((item) => item.direccionIp).length;

        return { total, activas, mantenimiento, red };
    }, [impresoras]);

    const estados = ["Todos", ...Array.from(new Set(impresoras.map((e) => e.estado)))];

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Gestión de impresión
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                            Impresoras institucionales
                        </h2>

                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Registro, control y trazabilidad de impresoras, mantenimientos,
                            tintas, tóner, contadores y asignaciones por dependencia.
                        </p>
                    </div>

                    {canManageTechnical ? (
                        <Link
                            href="/impresoras/nueva"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/20 transition hover:-translate-y-0.5"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva impresora
                        </Link>
                    ) : null}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total impresoras"
                    value={stats.total}
                    icon={Printer}
                />
                <StatCard
                    title="Activas"
                    value={stats.activas}
                    icon={Wifi}
                />
                <StatCard
                    title="En mantenimiento"
                    value={stats.mantenimiento}
                    icon={Wrench}
                />
                <StatCard
                    title="Con IP registrada"
                    value={stats.red}
                    icon={ServerCrash}
                />
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar por codigo, serial, marca, dependencia o IP"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600">
                        <Filter className="h-4 w-4" />
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="w-full bg-transparent outline-none"
                        >
                            {estados.map((estado) => (
                                <option key={estado}>{estado}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("Todos");
                        }}
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition hover:bg-green-50 hover:text-[#006b2e]"
                    >
                        Limpiar
                    </button>
                </div>
            </section>

            {message ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            ) : null}

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Printer className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Inventario de impresoras
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Equipos registrados
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando impresoras...
                    </p>
                ) : filteredImpresoras.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-black text-[#14233b]">
                            Todavía no hay impresoras registradas
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Crea la primera impresora para iniciar la hoja de vida y el
                            historial de consumibles.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Impresora</th>
                                    <th className="px-4 py-3">Serial</th>
                                    <th className="px-4 py-3">Dependencia</th>
                                    <th className="px-4 py-3">IP</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredImpresoras.map((impresora) => (
                                    <tr key={impresora.id}>
                                        <td className="px-4 py-3 font-black text-[#006b2e]">
                                            {impresora.codigoInterno}
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="font-black text-[#14233b]">
                                                {impresora.marca} {impresora.modelo}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {impresora.tipoImpresora} ·{" "}
                                                {impresora.tecnologiaImpresion}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {impresora.serial}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {impresora.dependencia}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {impresora.direccionIp ?? "Sin IP"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#006b2e]">
                                                {impresora.estado}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/impresoras/${impresora.id}`}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#006b2e] px-3 text-xs font-black text-white"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver hoja de vida
                                            </Link>
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

function StatCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {title}
                    </p>
                    <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#14233b]">
                        {value}
                    </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </article>
    );
}
