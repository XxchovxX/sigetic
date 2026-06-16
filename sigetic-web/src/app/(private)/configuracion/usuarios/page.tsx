"use client";

import { useEffect, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import {
    createUsuario,
    getRoles,
    getUsuarios,
    updateUsuario,
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
    const [editingUserId, setEditingUserId] = useState("");
    const [activo, setActivo] = useState(true);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function loadData() {
        try {
            setIsLoading(true);
            setMessage("");

            const usuariosData = await getUsuarios();
            const rolesData = await getRoles();

            setUsuarios(usuariosData);
            setRoles(rolesData);

            if (rolesData.length > 0) {
                setRolId((currentRolId) => currentRolId || rolesData[0].id);
            }
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar los usuarios."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!nombreCompleto.trim()) {
            setMessageType("error");
            setMessage("El nombre completo es obligatorio.");
            return;
        }

        if (!correo.trim()) {
            setMessageType("error");
            setMessage("El correo es obligatorio.");
            return;
        }

        if (!editingUserId && (!password.trim() || password.length < 8)) {
            setMessageType("error");
            setMessage("La contraseña debe tener mínimo 8 caracteres.");
            return;
        }

        if (!rolId) {
            setMessageType("error");
            setMessage("Debe seleccionar un rol.");
            return;
        }

        try {
            setIsSubmitting(true);
            setMessage("");

            if (editingUserId) {
                await updateUsuario(editingUserId, {
                    nombreCompleto: nombreCompleto.trim(),
                    correo: correo.trim(),
                    rolId,
                    activo,
                });
            } else {
                await createUsuario({
                    nombreCompleto: nombreCompleto.trim(),
                    correo: correo.trim(),
                    password,
                    rolId,
                });
            }

            setNombreCompleto("");
            setCorreo("");
            setPassword("Temporal123*");
            setEditingUserId("");
            setActivo(true);

            setMessageType("success");
            setMessage(editingUserId ? "Usuario actualizado correctamente." : "Usuario creado correctamente.");

            await loadData();
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el usuario."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function startEdit(usuario: Usuario) {
        setEditingUserId(usuario.id);
        setNombreCompleto(usuario.nombreCompleto);
        setCorreo(usuario.correo);
        setRolId(usuario.rolId);
        setActivo(usuario.activo);
        setPassword("Temporal123*");
        setMessage("");
    }

    function cancelEdit() {
        setEditingUserId("");
        setNombreCompleto("");
        setCorreo("");
        setPassword("Temporal123*");
        setActivo(true);
        setRolId(roles[0]?.id ?? "");
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
                            {editingUserId ? "Editar usuario" : "Nuevo usuario"}
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            {editingUserId ? "Actualizar acceso al sistema" : "Crear acceso al sistema"}
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-4">
                    {!editingUserId ? (
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
                    ) : null}

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Correo
                        </span>
                        <input
                            type="email"
                            value={correo}
                            onChange={(event) => setCorreo(event.target.value)}
                            placeholder="usuario@correo.com"
                            className={inputClass}
                        />
                    </label>

                    {editingUserId ? (
                        <label className="block">
                            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                                Estado
                            </span>
                            <select
                                value={activo ? "Activo" : "Inactivo"}
                                onChange={(event) => setActivo(event.target.value === "Activo")}
                                className={inputClass}
                            >
                                <option>Activo</option>
                                <option>Inactivo</option>
                            </select>
                        </label>
                    ) : null}

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Contraseña temporal
                        </span>
                        <input
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Mínimo 8 caracteres"
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
                            {roles.length === 0 ? (
                                <option value="">No hay roles disponibles</option>
                            ) : (
                                roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre}
                                    </option>
                                ))
                            )}
                        </select>
                    </label>

                    {message ? (
                        <div
                            className={`rounded-2xl px-4 py-3 text-sm font-bold ${messageType === "success"
                                    ? "bg-green-50 text-[#006b2e]"
                                    : "bg-red-50 text-red-700"
                                }`}
                        >
                            {message}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting || roles.length === 0}
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting
                            ? "Guardando..."
                            : editingUserId
                                ? "Actualizar usuario"
                                : "Crear usuario"}
                    </button>
                    {editingUserId ? (
                        <button
                            type="button"
                            onClick={cancelEdit}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-600"
                        >
                            Cancelar edicion
                        </button>
                    ) : null}
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
                ) : usuarios.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-sm font-black text-[#14233b]">
                            No hay usuarios registrados
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                            Crea el primer usuario desde el formulario.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[720px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Usuario</th>
                                    <th className="px-4 py-3">Correo</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
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
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(usuario)}
                                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-[#006b2e] transition hover:bg-green-50"
                                            >
                                                Editar
                                            </button>
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
