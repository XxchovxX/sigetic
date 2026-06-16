"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import {
    createUsuario,
    getRoles,
    getUsuarios,
    type Rol,
    type Usuario,
} from "@/lib/administracion-api";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("Temporal123*");
    const [rolId, setRolId] = useState("");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [usuariosData, rolesData] = await Promise.all([
                getUsuarios(),
                getRoles(),
            ]);

            setUsuarios(usuariosData);
            setRoles(rolesData);

            if (!rolId && rolesData.length > 0) {
                setRolId(rolesData[0].id);
            }
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar los usuarios."
            );
        } finally {
            setIsLoading(false);
        }
    }, [rolId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            await createUsuario({
                nombreCompleto,
                correo,
                password,
                rolId,
            });

            setNombreCompleto("");
            setCorreo("");
            setPassword("Temporal123*");
            setMessage("Usuario creado correctamente.");
            await loadData();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el usuario."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Plus className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Nuevo usuario
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Crear acceso al sistema
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Nombre completo
                        </span>
                        <input
                            value={nombreCompleto}
                            onChange={(event) => setNombreCompleto(event.target.value)}
                            placeholder="Nombre del usuario"
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
                            placeholder="usuario@correo.com"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Contraseña temporal
                        </span>
                        <input
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Rol
                        </span>
                        <select
                            value={rolId}
                            onChange={(event) => setRolId(event.target.value)}
                            className={inputClass}
                        >
                            {roles.map((rol) => (
                                <option key={rol.id} value={rol.id}>
                                    {rol.nombre}
                                </option>
                            ))}
                        </select>
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
                        {isSubmitting ? "Guardando..." : "Crear usuario"}
                    </button>
                </form>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <UsersRound className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Usuarios
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Accesos registrados
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando usuarios...
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Correo</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="px-4 py-3 font-black text-[#14233b]">
                                            {usuario.nombreCompleto}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {usuario.correo}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {usuario.rol}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${usuario.activo
                                                        ? "bg-green-50 text-[#006b2e]"
                                                        : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {usuario.activo ? "Activo" : "Inactivo"}
                                            </span>
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

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";
