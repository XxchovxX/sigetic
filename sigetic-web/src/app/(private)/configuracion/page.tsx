"use client";

import { useCallback, useEffect, useState } from "react";
import {
    KeyRound,
    Plus,
    Trash2,
    UserCheck,
    UserX,
    UsersRound,
} from "lucide-react";
import {
    cambiarPasswordUsuario,
    createUsuario,
    deleteUsuario,
    getRoles,
    getUsuarios,
    updateUsuario,
    type Rol,
    type Usuario,
} from "@/lib/administracion-api";
import { getStoredUser } from "@/lib/auth";

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [rolId, setRolId] = useState("");
    const [passwords, setPasswords] = useState<Record<string, string>>({});

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [changingPasswordId, setChangingPasswordId] = useState("");
    const [updatingStatusId, setUpdatingStatusId] = useState("");
    const [deletingUserId, setDeletingUserId] = useState("");

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
            setMessageType("error");
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

        if (!nombreCompleto.trim()) {
            setMessageType("error");
            setMessage("El nombre completo es obligatorio.");
            return;
        }

        if (!correo.trim() || !correo.includes("@")) {
            setMessageType("error");
            setMessage("Ingresa un correo válido para el usuario.");
            return;
        }

        if (!password.trim() || password.length < 8) {
            setMessageType("error");
            setMessage("La contraseña temporal debe tener mínimo 8 caracteres.");
            return;
        }

        if (!rolId) {
            setMessageType("error");
            setMessage("Selecciona un rol para el usuario.");
            return;
        }

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
            setPassword("");
            setMessageType("success");
            setMessage("Usuario creado correctamente.");
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

    async function handleCambiarPassword(usuario: Usuario) {
        const nuevoPassword = passwords[usuario.id] ?? "";

        try {
            setChangingPasswordId(usuario.id);
            setMessage("");

            if (!nuevoPassword.trim() || nuevoPassword.length < 8) {
                setMessageType("error");
                setMessage("La nueva contraseña debe tener mínimo 8 caracteres.");
                return;
            }

            await cambiarPasswordUsuario(usuario.id, {
                nuevoPassword,
            });

            setPasswords((current) => ({
                ...current,
                [usuario.id]: "",
            }));
            setMessageType("success");
            setMessage(`Contraseña actualizada para ${usuario.nombreCompleto}.`);
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cambiar la contraseña."
            );
        } finally {
            setChangingPasswordId("");
        }
    }

    async function handleToggleUsuario(usuario: Usuario) {
        const storedUser = getStoredUser();

        if (storedUser?.id === usuario.id && usuario.activo) {
            setMessageType("error");
            setMessage(
                "No puedes desactivar tu propio usuario mientras tienes la sesión abierta."
            );
            return;
        }

        try {
            setUpdatingStatusId(usuario.id);
            setMessage("");

            await updateUsuario(usuario.id, {
                nombreCompleto: usuario.nombreCompleto,
                correo: usuario.correo,
                rolId: usuario.rolId,
                activo: !usuario.activo,
            });

            setMessage(
                usuario.activo
                    ? `Usuario ${usuario.nombreCompleto} desactivado.`
                    : `Usuario ${usuario.nombreCompleto} reactivado.`
            );
            setMessageType("success");
            await loadData();
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible actualizar el estado del usuario."
            );
        } finally {
            setUpdatingStatusId("");
        }
    }

    async function handleDeleteUsuario(usuario: Usuario) {
        const storedUser = getStoredUser();

        if (storedUser?.id === usuario.id) {
            setMessageType("error");
            setMessage(
                "No puedes eliminar tu propio usuario mientras tienes la sesión abierta."
            );
            return;
        }

        const confirmed = window.confirm(
            `¿Eliminar el usuario ${usuario.nombreCompleto}? Esta acción no se puede deshacer.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingUserId(usuario.id);
            setMessage("");

            await deleteUsuario(usuario.id);

            setMessageType("success");
            setMessage(`Usuario ${usuario.nombreCompleto} eliminado.`);
            await loadData();
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible eliminar el usuario."
            );
        } finally {
            setDeletingUserId("");
        }
    }

    return (
        <div className="grid items-start gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Plus className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006b2e]">
                            Nuevo usuario
                        </p>
                        <h2 className="text-2xl font-black leading-tight tracking-[-0.03em]">
                            Crear acceso al sistema
                        </h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-3.5">
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
                            type="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Define una contraseña temporal"
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
                        <div
                            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                                messageType === "success"
                                    ? "bg-green-50 text-[#006b2e]"
                                    : "bg-red-50 text-red-700"
                            }`}
                        >
                            {message}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                    >
                        {isSubmitting ? "Guardando..." : "Crear usuario"}
                    </button>
                </form>
            </section>

            <section className="min-w-0 rounded-[1.35rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <UsersRound className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006b2e]">
                                Usuarios
                            </p>
                            <h2 className="text-2xl font-black tracking-[-0.03em]">
                                Accesos registrados
                            </h2>
                        </div>
                    </div>

                    <p className="max-w-[360px] text-sm leading-6 text-slate-500">
                        Desactiva usuarios para bloquear el acceso sin perder historial.
                    </p>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando usuarios...
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1040px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="w-[21%] px-5 py-3">Usuario</th>
                                    <th className="w-[24%] px-5 py-3">Correo</th>
                                    <th className="w-[18%] px-5 py-3">Rol</th>
                                    <th className="w-[11%] px-5 py-3">Estado</th>
                                    <th className="w-[26%] px-5 py-3">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {usuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="px-5 py-4 align-middle font-black leading-6 text-[#14233b]">
                                            {usuario.nombreCompleto}
                                        </td>
                                        <td className="px-5 py-4 align-middle text-slate-600">
                                            {usuario.correo}
                                        </td>
                                        <td className="px-5 py-4 align-middle text-slate-600">
                                            {usuario.rol}
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${usuario.activo
                                                        ? "bg-green-50 text-[#006b2e]"
                                                        : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {usuario.activo ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            <div className="grid gap-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="password"
                                                        value={passwords[usuario.id] ?? ""}
                                                        onChange={(event) =>
                                                            setPasswords((current) => ({
                                                                ...current,
                                                                [usuario.id]: event.target.value,
                                                            }))
                                                        }
                                                        placeholder="Nueva contraseña"
                                                        className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCambiarPassword(usuario)}
                                                        disabled={
                                                            changingPasswordId === usuario.id ||
                                                            !(passwords[usuario.id] ?? "").trim()
                                                        }
                                                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-[#006b2e] px-3 text-xs font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <KeyRound className="h-4 w-4" />
                                                        Cambiar
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleUsuario(usuario)}
                                                    disabled={updatingStatusId === usuario.id}
                                                    className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${usuario.activo
                                                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                                                            : "bg-green-50 text-[#006b2e] hover:bg-green-100"
                                                        }`}
                                                >
                                                    {usuario.activo ? (
                                                        <UserX className="h-4 w-4" />
                                                    ) : (
                                                        <UserCheck className="h-4 w-4" />
                                                    )}
                                                    {usuario.activo ? "Desactivar usuario" : "Reactivar usuario"}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteUsuario(usuario)}
                                                    disabled={deletingUserId === usuario.id}
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Eliminar usuario
                                                </button>
                                            </div>
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
