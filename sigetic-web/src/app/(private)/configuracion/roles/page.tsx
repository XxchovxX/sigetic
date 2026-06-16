"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import {
    createRol,
    getRoles,
    type Rol,
} from "@/lib/administracion-api";

export default function RolesPage() {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function loadRoles() {
        try {
            setIsLoading(true);
            const data = await getRoles();
            setRoles(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar los roles."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadRoles();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            await createRol({
                nombre,
                descripcion,
            });

            setNombre("");
            setDescripcion("");
            setMessage("Rol creado correctamente.");
            await loadRoles();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el rol."
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
                            Nuevo rol
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Crear rol
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
                            placeholder="Ej: Soporte Nivel 1"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Descripción
                        </span>
                        <textarea
                            value={descripcion}
                            onChange={(event) => setDescripcion(event.target.value)}
                            rows={4}
                            placeholder="Describe el alcance del rol dentro del sistema..."
                            className={textareaClass}
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
                        {isSubmitting ? "Guardando..." : "Crear rol"}
                    </button>
                </form>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <ShieldCheck className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Roles del sistema
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Listado de roles
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">Cargando roles...</p>
                ) : (
                    <div className="grid gap-3">
                        {roles.map((rol) => (
                            <article
                                key={rol.id}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                            >
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <h3 className="font-black text-[#14233b]">{rol.nombre}</h3>
                                        <p className="mt-1 text-sm leading-6 text-slate-500">
                                            {rol.descripcion}
                                        </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs font-black ${rol.activo
                                                ? "bg-green-50 text-[#006b2e]"
                                                : "bg-red-50 text-red-700"
                                            }`}
                                    >
                                        {rol.activo ? "Activo" : "Inactivo"}
                                    </span>
                                </div>

                                {rol.esSistema ? (
                                    <p className="mt-3 text-xs font-bold text-yellow-700">
                                        Rol base del sistema
                                    </p>
                                ) : null}
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

const textareaClass =
    "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";