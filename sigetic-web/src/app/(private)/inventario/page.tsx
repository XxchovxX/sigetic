"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    Computer,
    Download,
    Eye,
    Filter,
    Laptop,
    Monitor,
    Plus,
    Search,
    Server,
    SlidersHorizontal,
} from "lucide-react";
import { getEquipos, type Equipo } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";
import { canManageTechnicalAssets } from "@/lib/permissions";

function getEquipmentIcon(type: string) {
    const normalized = type.toLowerCase();

    if (normalized.includes("portátil")) return Laptop;
    if (normalized.includes("servidor")) return Server;

    return Monitor;
}

function getStatusClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized.includes("activo")) {
        return "bg-green-50 text-[#006b2e]";
    }

    if (normalized.includes("mantenimiento")) {
        return "bg-yellow-50 text-yellow-700";
    }

    if (normalized.includes("baja")) {
        return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
}

function exportToCsv(equipos: Equipo[]) {
    const headers = [
        "Código interno",
        "Tipo de equipo",
        "Marca",
        "Modelo",
        "Serial",
        "Dependencia",
        "Funcionario asignado",
        "Estado",
        "Procesador",
        "Memoria RAM",
        "Almacenamiento",
        "Sistema operativo",
        "Dirección IP",
        "Dirección MAC",
        "Ubicación física",
        "Fecha de ingreso",
    ];

    const rows = equipos.map((item) => [
        item.codigoInterno,
        item.tipoEquipo,
        item.marca,
        item.modelo,
        item.serial,
        item.dependencia,
        item.funcionarioAsignado,
        item.estado,
        item.procesador,
        item.memoriaRam,
        item.almacenamiento,
        item.sistemaOperativo,
        item.direccionIp ?? "",
        item.direccionMac ?? "",
        item.ubicacionFisica,
        item.fechaIngreso,
    ]);

    const csv = [headers, ...rows]
        .map((row) =>
            row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")
        )
        .join("\n");

    const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "inventario-tic-sigetic.csv";
    link.click();

    URL.revokeObjectURL(url);
}

export default function InventoryPage() {
    const canManageTechnical = canManageTechnicalAssets(getStoredUser());
    const [equipos, setEquipos] = useState<Equipo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");

    useEffect(() => {
        async function loadEquipos() {
            try {
                setIsLoading(true);
                setError("");

                const data = await getEquipos();
                setEquipos(data);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "No fue posible cargar el inventario TIC.";

                setError(message);
            } finally {
                setIsLoading(false);
            }
        }

        loadEquipos();
    }, []);

    const filteredEquipos = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        return equipos.filter((item) => {
            const matchesSearch =
                !normalizedSearch ||
                item.codigoInterno.toLowerCase().includes(normalizedSearch) ||
                item.serial.toLowerCase().includes(normalizedSearch) ||
                item.marca.toLowerCase().includes(normalizedSearch) ||
                item.modelo.toLowerCase().includes(normalizedSearch) ||
                item.dependencia.toLowerCase().includes(normalizedSearch) ||
                item.funcionarioAsignado.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "Todos" || item.estado === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [equipos, searchTerm, statusFilter]);

    const totalEquipos = equipos.length;

    const activos = equipos.filter((item) =>
        item.estado.toLowerCase().includes("activo")
    ).length;

    const mantenimiento = equipos.filter((item) =>
        item.estado.toLowerCase().includes("mantenimiento")
    ).length;

    const servidores = equipos.filter((item) =>
        item.tipoEquipo.toLowerCase().includes("servidor")
    ).length;

    const summary = [
        {
            title: "Total activos",
            value: totalEquipos.toString(),
            description: "Equipos registrados",
            icon: Computer,
        },
        {
            title: "Activos operativos",
            value: activos.toString(),
            description: "En uso institucional",
            icon: CheckCircle2,
        },
        {
            title: "En mantenimiento",
            value: mantenimiento.toString(),
            description: "Preventivo o correctivo",
            icon: SlidersHorizontal,
        },
        {
            title: "Servidores",
            value: servidores.toString(),
            description: "Infraestructura crítica",
            icon: Server,
        },
    ];

    const estados = ["Todos", ...Array.from(new Set(equipos.map((e) => e.estado)))];

    return (
        <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {summary.map((item) => {
                    const Icon = item.icon;

                    return (
                        <article
                            key={item.title}
                            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                    <Icon className="h-5 w-5" />
                                </div>

                                <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-500">
                                    TIC
                                </span>
                            </div>

                            <p className="text-sm font-bold text-slate-500">{item.title}</p>

                            <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                                {item.value}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                {item.description}
                            </p>
                        </article>
                    );
                })}
            </section>

            <section className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                                Inventario centralizado
                            </p>

                            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#14233b]">
                                Activos tecnológicos registrados
                            </h2>

                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                                Control de equipos de cómputo, servidores, portátiles y activos
                                TIC asignados a funcionarios y dependencias de la Alcaldía.
                            </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={() => exportToCsv(filteredEquipos)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4" />
                                Exportar
                            </button>

                            {canManageTechnical ? (
                                <Link
                                    href="/inventario/nuevo"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-4 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5"
                                >
                                    <Plus className="h-4 w-4" />
                                    Registrar equipo
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                            <Search className="h-4 w-4 text-slate-400" />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Buscar por código, serial, marca, dependencia o funcionario..."
                                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                            />
                        </div>

                        <div className="flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm">
                            <Filter className="h-4 w-4" />

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="bg-transparent outline-none"
                            >
                                {estados.map((estado) => (
                                    <option key={estado} value={estado}>
                                        {estado}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                setSearchTerm("");
                                setStatusFilter("Todos");
                            }}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-green-50 hover:text-[#006b2e]"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Limpiar
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="m-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="flex min-h-[260px] items-center justify-center p-8">
                        <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-bold text-[#006b2e]">
                            Cargando inventario TIC...
                        </div>
                    </div>
                ) : filteredEquipos.length === 0 ? (
                    <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <AlertTriangle className="h-6 w-6" />
                        </div>

                        <h3 className="text-lg font-black text-[#14233b]">
                            No hay equipos para mostrar
                        </h3>

                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            Usa el boton Registrar equipo de la parte superior o ajusta los
                            filtros de busqueda.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] table-fixed border-collapse text-left">
                                <colgroup>
                                    <col className="w-[190px]" />
                                    <col className="w-[170px]" />
                                    <col className="w-[140px]" />
                                    <col className="w-[210px]" />
                                    <col className="w-[160px]" />
                                    <col className="w-[230px]" />
                                    <col className="w-[130px]" />
                                    <col className="w-[110px]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Activo</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Marca / modelo</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Serial</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Dependencia</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Asignado a</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Caracteristicas</th>
                                        <th className="whitespace-nowrap px-5 py-4 font-black">Estado</th>
                                        <th className="whitespace-nowrap px-5 py-4 text-right font-black">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {filteredEquipos.map((equipment) => {
                                        const Icon = getEquipmentIcon(equipment.tipoEquipo);

                                        return (
                                            <tr
                                                key={equipment.id}
                                                className="bg-white transition hover:bg-green-50/40"
                                            >
                                                <td className="px-5 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                                                            <Icon className="h-5 w-5" />
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="whitespace-nowrap text-sm font-black text-[#14233b]">
                                                                {equipment.codigoInterno}
                                                            </p>
                                                            <p className="mt-1 truncate text-xs text-slate-500">
                                                                {equipment.tipoEquipo}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <p className="truncate text-sm font-black text-slate-800">
                                                        {equipment.marca}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {equipment.modelo}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <span className="inline-flex max-w-full rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                                                        <span className="truncate">{equipment.serial}</span>
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-700">
                                                        {equipment.dependencia}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <p className="truncate text-sm text-slate-600">
                                                        {equipment.funcionarioAsignado}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <p className="truncate text-xs font-bold text-slate-700">
                                                        {equipment.procesador} - {equipment.memoriaRam}
                                                    </p>
                                                    <p className="mt-1 truncate text-xs text-slate-500">
                                                        {equipment.almacenamiento} -{" "}
                                                        {equipment.sistemaOperativo}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <span
                                                        className={`inline-flex max-w-full whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-black ${getStatusClass(
                                                            equipment.estado
                                                        )}`}
                                                    >
                                                        {equipment.estado}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 align-middle">
                                                    <div className="flex justify-end gap-2">
                                                        <Link
                                                            href={`/inventario/${equipment.id}`}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-green-50 hover:text-[#006b2e]"
                                                            title="Ver hoja de vida"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>

                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                            <p>
                                Mostrando{" "}
                                <strong className="text-slate-800">
                                    {filteredEquipos.length}
                                </strong>{" "}
                                de <strong className="text-slate-800">{equipos.length}</strong>{" "}
                                activos registrados.
                            </p>

                            <p className="text-xs font-bold text-slate-400">
                                Vista completa sin paginacion.
                            </p>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
