"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
    ClipboardList,
    ExternalLink,
    FileSpreadsheet,
    Monitor,
    Printer,
    Search,
} from "lucide-react";
import { getEquipos, type Equipo } from "@/lib/api";
import { getImpresoras, type Impresora } from "@/lib/impresoras-api";

type ActivoHojaVida = {
    id: string;
    clase: "Equipo TIC" | "Impresora";
    codigoInterno: string;
    tipo: string;
    marca: string;
    modelo: string;
    serial: string;
    dependencia: string;
    funcionario: string;
    estado: string;
    fechaIngreso: string;
    href: string;
};

function equipoToActivo(equipo: Equipo): ActivoHojaVida {
    return {
        id: equipo.id,
        clase: "Equipo TIC",
        codigoInterno: equipo.codigoInterno,
        tipo: equipo.tipoEquipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        serial: equipo.serial,
        dependencia: equipo.dependencia,
        funcionario: equipo.funcionarioAsignado,
        estado: equipo.estado,
        fechaIngreso: equipo.fechaIngreso,
        href: `/inventario/${equipo.id}`,
    };
}

function impresoraToActivo(impresora: Impresora): ActivoHojaVida {
    return {
        id: impresora.id,
        clase: "Impresora",
        codigoInterno: impresora.codigoInterno,
        tipo: impresora.tipoImpresora,
        marca: impresora.marca,
        modelo: impresora.modelo,
        serial: impresora.serial,
        dependencia: impresora.dependencia,
        funcionario: impresora.funcionarioAsignado ?? "",
        estado: impresora.estado,
        fechaIngreso: impresora.fechaIngreso,
        href: `/impresoras/${impresora.id}`,
    };
}

function getStatusClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized.includes("activo")) return "bg-green-50 text-[#006b2e]";
    if (normalized.includes("mantenimiento")) return "bg-yellow-50 text-yellow-700";
    if (normalized.includes("baja")) return "bg-red-50 text-red-700";

    return "bg-slate-100 text-slate-600";
}

export default function HojasDeVidaPage() {
    const [activos, setActivos] = useState<ActivoHojaVida[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        async function loadActivos() {
            try {
                setIsLoading(true);
                setError("");

                const [equipos, impresoras] = await Promise.all([
                    getEquipos(),
                    getImpresoras(),
                ]);

                setActivos([
                    ...equipos.map(equipoToActivo),
                    ...impresoras.map(impresoraToActivo),
                ]);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "No fue posible cargar las hojas de vida."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadActivos();
    }, []);

    const filteredActivos = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        if (!normalizedSearch) return activos;

        return activos.filter((activo) =>
            [
                activo.codigoInterno,
                activo.tipo,
                activo.marca,
                activo.modelo,
                activo.serial,
                activo.dependencia,
                activo.funcionario,
                activo.estado,
            ]
                .join(" ")
                .toLowerCase()
                .includes(normalizedSearch)
        );
    }, [activos, searchTerm]);

    const totalEquipos = activos.filter((activo) => activo.clase === "Equipo TIC").length;
    const totalImpresoras = activos.filter((activo) => activo.clase === "Impresora").length;

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                    Hojas de vida
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                    Activos tecnológicos registrados
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                    Consulta equipos TIC e impresoras con enlace a su hoja de vida,
                    trazabilidad y mantenimientos.
                </p>
            </section>

            <section className="grid gap-4 md:grid-cols-3">
                <SummaryCard icon={ClipboardList} label="Activos registrados" value={activos.length} />
                <SummaryCard icon={Monitor} label="Equipos TIC" value={totalEquipos} />
                <SummaryCard icon={Printer} label="Impresoras" value={totalImpresoras} />
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar por código, serial, dependencia o funcionario"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>

                    <Link
                        href="/reportes"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#006b2e] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20"
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Exportar Excel
                    </Link>
                </div>

                {error ? (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {error}
                    </div>
                ) : null}
            </section>

            <section className="overflow-x-auto rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
                <div className="grid min-w-[920px] grid-cols-[260px_220px_180px_130px_56px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wide text-slate-500">
                    <span>Activo</span>
                    <span>Dependencia</span>
                    <span>Responsable</span>
                    <span>Estado</span>
                    <span />
                </div>

                {isLoading ? (
                    <div className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                        Cargando hojas de vida...
                    </div>
                ) : null}

                {!isLoading && filteredActivos.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                        No hay activos tecnológicos para mostrar.
                    </div>
                ) : null}

                {!isLoading
                    ? filteredActivos.map((activo) => (
                          <Link
                              key={`${activo.clase}-${activo.id}`}
                              href={activo.href}
                              className="grid min-w-[920px] grid-cols-[260px_220px_180px_130px_56px] gap-4 border-b border-slate-100 px-5 py-4 text-sm transition hover:bg-green-50/50"
                          >
                              <div>
                                  <p className="whitespace-nowrap font-black text-[#14233b]">
                                      {activo.codigoInterno}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-500">
                                      {activo.clase} - {activo.marca} {activo.modelo}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-slate-400">
                                      Serial {activo.serial} - Ingreso {activo.fechaIngreso}
                                  </p>
                              </div>
                              <span className="self-center truncate text-slate-600">
                                  {activo.dependencia}
                              </span>
                              <span className="self-center truncate text-slate-600">
                                  {activo.funcionario || "Sin asignar"}
                              </span>
                              <span
                                  className={`inline-flex w-fit self-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                                      activo.estado
                                  )}`}
                              >
                                  {activo.estado}
                              </span>
                              <span className="flex h-10 w-10 items-center justify-center self-center rounded-2xl bg-white text-[#006b2e] shadow-sm">
                                  <ExternalLink className="h-4 w-4" />
                              </span>
                          </Link>
                      ))
                    : null}
            </section>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
}: {
    icon: ElementType;
    label: string;
    value: number;
}) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-black tracking-[-0.05em] text-[#14233b]">
                {value}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
        </article>
    );
}
