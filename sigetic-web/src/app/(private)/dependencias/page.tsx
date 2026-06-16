"use client";

import { useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import {
    createDependencia,
    getDependencias,
    type Dependencia,
} from "@/lib/administracion-api";

export default function DependenciasPage() {
    const [dependencias, setDependencias] = useState<Dependencia[]>([]);

    const [nombre, setNombre] = useState("");
    const [codigo, setCodigo] = useState("");
    const [responsable, setResponsable] = useState("");
    const [correo, setCorreo] = useState("");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function loadDependencias() {
        try {
            setIsLoading(true);
            const data = await getDependencias();
            setDependencias(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar las dependencias."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadDependencias();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            await createDependencia({
                nombre,
                codigo,
                responsable: responsable || null,
                correo: correo || null,
            });

            setNombre("");
            setCodigo("");
            setResponsable("");
            setCorreo("");
            setMessage("Dependencia creada correctamente.");
            await loadDependencias();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear la dependencia."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Plus className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Nueva dependencia
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Registrar dependencia
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Nombre
                        </span>
                        <input
                            value={nombre}
                            onChange={(event) => setNombre(event.target.value)}
                            placeholder="Ej: Secretaría de Gobierno"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Código
                        </span>
                        <input
                            value={codigo}
                            onChange={(event) => setCodigo(event.target.value)}
                            placeholder="Ej: GOB"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Responsable
                        </span>
                        <input
                            value={responsable}
                            onChange={(event) => setResponsable(event.target.value)}
                            placeholder="Nombre del responsable"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Correo
                        </span>
                        <input
                            value={correo}
                            onChange={(event) => setCorreo(event.target.value)}
                            placeholder="correo@dominio.com"
                            className={inputClass}
                        />
                    </label>

                    {message ? (
                        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                            {message}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                    >
                        {isSubmitting ? "Guardando..." : "Crear dependencia"}
                    </button>
                </form>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Building2 className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Dependencias
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Áreas registradas
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando dependencias...
                    </p>
                ) : (
                    <div className="grid gap-3">
                        {dependencias.map((dependencia) => (
                            <article
                                key={dependencia.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="font-black text-[#14233b]">
                                            {dependencia.nombre}
                                        </h3>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Código: {dependencia.codigo}
                                        </p>

                                        <p className="mt-1 text-sm text-slate-500">
                                            Responsable: {dependencia.responsable ?? "No registrado"}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${dependencia.activa
                                                ? "bg-green-50 text-[#006b2e]"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                    >
                                        {dependencia.activa ? "Activa" : "Inactiva"}
                                    </span>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";