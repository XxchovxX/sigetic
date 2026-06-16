"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Eye, Package, Plus } from "lucide-react";
import { getConsumibles, type Consumible } from "@/lib/consumibles-api";

export default function ConsumiblesPage() {
    const [consumibles, setConsumibles] = useState<Consumible[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setMessage("");
                setConsumibles(await getConsumibles());
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar los consumibles."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    const stats = useMemo(() => {
        const total = consumibles.length;
        const activos = consumibles.filter((item) => item.activo).length;
        const bajoStock = consumibles.filter((item) => item.bajoStock).length;
        const stock = consumibles.reduce((sum, item) => sum + item.stockActual, 0);

        return { total, activos, bajoStock, stock };
    }, [consumibles]);

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Inventario de insumos
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                            Consumibles generales
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Control de tintas, tóner, tambores, botellas residuales,
                            repuestos y otros insumos TIC con trazabilidad de stock.
                        </p>
                    </div>

                    <Link
                        href="/consumibles/nuevo"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/20 transition hover:-translate-y-0.5"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo consumible
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total consumibles" value={stats.total} icon={Package} />
                <StatCard title="Activos" value={stats.activos} icon={Boxes} />
                <StatCard title="Bajo stock" value={stats.bajoStock} icon={AlertTriangle} />
                <StatCard title="Unidades en stock" value={stats.stock} icon={Package} />
            </section>

            {message ? (
                <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {message}
                </div>
            ) : null}

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Existencias
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Consumibles registrados
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando consumibles...
                    </p>
                ) : consumibles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                        <p className="text-sm font-black text-[#14233b]">
                            Todavía no hay consumibles registrados
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[980px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Código</th>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Referencia</th>
                                    <th className="px-4 py-3">Color</th>
                                    <th className="px-4 py-3">Stock actual</th>
                                    <th className="px-4 py-3">Stock mínimo</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {consumibles.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-black text-[#006b2e]">
                                            {item.codigoInterno}
                                        </td>
                                        <td className="px-4 py-3 font-black text-[#14233b]">
                                            {item.nombre}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.tipoConsumible}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.referencia}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.color}
                                        </td>
                                        <td className="px-4 py-3 font-black text-[#14233b]">
                                            {item.stockActual} {item.unidadMedida}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {item.stockMinimo}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${item.bajoStock
                                                        ? "bg-yellow-50 text-yellow-700"
                                                        : item.activo
                                                            ? "bg-green-50 text-[#006b2e]"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                            >
                                                {item.bajoStock
                                                    ? "Bajo stock"
                                                    : item.activo
                                                        ? "Activo"
                                                        : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Link
                                                href={`/consumibles/${item.id}`}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#006b2e] px-3 text-xs font-black text-white"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver
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
