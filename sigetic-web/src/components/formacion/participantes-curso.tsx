"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Download, Loader2, RefreshCw, Search, UsersRound } from "lucide-react";
import { getParticipantesCursoFormacion, type ParticipacionCursoFormacion } from "@/lib/formacion-api";
import { descargarParticipantesCurso } from "@/lib/export-participantes-formacion";

export default function ParticipantesCurso({ cursoId, titulo }: { cursoId: string; titulo: string }) {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<ParticipacionCursoFormacion[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("Todos");
    const [dependency, setDependency] = useState("");

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        getParticipantesCursoFormacion(cursoId).then((items) => {
            if (cancelled) return;
            setRows(items);
            setLoaded(true);
        }).catch((err) => {
            if (cancelled) return;
            setError(err instanceof Error ? err.message : "No se pudo cargar el listado.");
            setLoaded(true);
        });
        return () => { cancelled = true; };
    }, [cursoId, open, revision]);

    const dependencies = [...new Set(rows.map((row) => row.dependencia || "Sin dependencia"))].sort();
    const term = search.trim().toLocaleLowerCase("es");
    const filtered = rows.filter((row) =>
        (!term || `${row.nombreCompleto} ${row.correo} ${row.cargo ?? ""}`.toLocaleLowerCase("es").includes(term)) &&
        (status === "Todos" || row.aprobado === (status === "Aprobados")) &&
        (!dependency || (row.dependencia || "Sin dependencia") === dependency));
    const approved = rows.filter((row) => row.aprobado).length;
    const controlClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700";

    return (
        <section className="min-w-0 border-y border-slate-200 py-4">
            <button type="button" aria-expanded={open} aria-controls={`participantes-${cursoId}`} onClick={() => {
                setLoaded(false);
                setError("");
                setOpen(!open);
            }} className="flex min-h-10 w-full items-center gap-2 text-left font-bold text-[#006b2e]">
                <UsersRound className="h-5 w-5 shrink-0" />
                <span className="flex-1">Participantes y resultados del curso</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open ? (
                <div id={`participantes-${cursoId}`} className="mt-3 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <p aria-live="polite" className="text-sm text-slate-600">
                            {loaded && !error ? `${rows.length} participantes · ${approved} aprobados · ${rows.length - approved} no aprobados` : "Resultados"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" title="Actualizar listado" aria-label="Actualizar listado" disabled={!loaded} onClick={() => {
                                setLoaded(false); setError(""); setRevision((value) => value + 1);
                            }} className={`${controlClass} inline-flex w-10 items-center justify-center px-0 disabled:opacity-50`}>
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button type="button" disabled={!loaded || !!error || !filtered.length} onClick={() => descargarParticipantesCurso(titulo, filtered)} className={`${controlClass} inline-flex items-center gap-2 font-bold disabled:opacity-50`}>
                                <Download className="h-4 w-4" />Exportar listado
                            </button>
                        </div>
                    </div>
                    {!loaded ? <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Cargando participantes...</p> : error ? <p role="alert" className="text-sm text-red-700">{error}</p> : (
                        <>
                            <div className="flex flex-col gap-2 xl:flex-row">
                                <label className="relative min-w-0 flex-1">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <input aria-label="Buscar participante" placeholder="Nombre, correo o cargo" value={search} onChange={(event) => setSearch(event.target.value)} className={`${controlClass} w-full pl-9`} />
                                </label>
                                <select aria-label="Filtrar por resultado" value={status} onChange={(event) => setStatus(event.target.value)} className={controlClass}>
                                    <option value="Todos">Todos los resultados</option><option>Aprobados</option><option>No aprobados</option>
                                </select>
                                <select aria-label="Filtrar por dependencia" value={dependency} onChange={(event) => setDependency(event.target.value)} className={`${controlClass} min-w-0 xl:max-w-64`}>
                                    <option value="">Todas las dependencias</option>
                                    {dependencies.map((item) => <option key={item}>{item}</option>)}
                                </select>
                            </div>
                            <p className="text-xs text-slate-500">Mostrando {filtered.length} de {rows.length} participantes</p>
                            {filtered.length ? (
                                <div className="max-h-[32rem] overflow-auto">
                                    <table className="w-full text-left text-sm">
                                        <caption className="sr-only">Participantes de {titulo}</caption>
                                        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-600"><tr>
                                            {["Participante", "Dependencia actual / Cargo", "Resultado", "Mejor puntaje", "Intentos", "Fecha del resultado", "Certificado"].map((label) => <th scope="col" key={label} className="whitespace-nowrap px-3 py-3">{label}</th>)}
                                        </tr></thead>
                                        <tbody>{filtered.map((row) => <tr key={row.usuarioId} className="border-b border-slate-100 align-top">
                                            <td className="min-w-48 px-3 py-3"><p className="font-bold text-[#14233b]">{row.nombreCompleto}</p><p className="break-all text-xs text-slate-500">{row.correo}</p><p className="text-xs text-slate-500">{row.tipoVinculacion}</p></td>
                                            <td className="min-w-44 px-3 py-3">{row.dependencia || "Sin dependencia"}<p className="text-xs text-slate-500">{row.cargo || "Sin cargo"}</p></td>
                                            <td className={`whitespace-nowrap px-3 py-3 font-bold ${row.aprobado ? "text-[#006b2e]" : "text-red-700"}`}>{row.aprobado ? "Aprobado" : "No aprobado"}</td>
                                            <td className="px-3 py-3">{row.mejorPuntaje}%</td><td className="px-3 py-3">{row.numeroIntentos}</td>
                                            <td className="whitespace-nowrap px-3 py-3">{new Date(row.fechaResultadoUtc).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</td>
                                            <td className="px-3 py-3 text-xs">{row.codigoCertificado || "Sin certificado"}</td>
                                        </tr>)}</tbody>
                                    </table>
                                </div>
                            ) : <p className="py-6 text-sm text-slate-500">{rows.length ? "No hay participantes con estos filtros." : "Aún nadie ha presentado la evaluación de este curso."}</p>}
                        </>
                    )}
                </div>
            ) : null}
        </section>
    );
}
