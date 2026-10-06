"use client";

import { useCallback, useEffect, useState } from "react";
import {
    GraduationCap,
    Download,
    FileText,
    Loader2,
    Search,
    Settings2,
    KeyRound,
    Plus,
    Trash2,
    UserCheck,
    UserX,
    UsersRound,
} from "lucide-react";
import {
    cambiarPasswordUsuario,
    configurarGestionFormacion,
    createUsuario,
    deleteUsuario,
    getRoles,
    getUsuarios,
    getUsuariosConsulta,
    getDependencias,
    updateUsuario,
    type Rol,
    type Usuario,
    type Dependencia,
} from "@/lib/administracion-api";
import { getStoredUser } from "@/lib/auth";
import { canManageUsers } from "@/lib/permissions";
import { exportUsuariosExcel, exportUsuariosPdf, formatUserDate } from "@/lib/export-usuarios";

function calculateTrainingExpiration(duration: string) {
    if (duration === "indefinido") return null;

    const expiration = new Date();
    expiration.setUTCDate(expiration.getUTCDate() + Number(duration));
    return expiration.toISOString();
}

export default function UsuariosPage() {
    const canManage = canManageUsers(getStoredUser());
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [dependencias, setDependencias] = useState<Dependencia[]>([]);
    const [dependenciaId, setDependenciaId] = useState("");
    const [cargo, setCargo] = useState("");
    const [tipoVinculacion, setTipoVinculacion] = useState("Funcionario");

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [rolId, setRolId] = useState("");
    const [passwords, setPasswords] = useState<Record<string, string>>({});
    const [trainingDurations, setTrainingDurations] = useState<Record<string, string>>({});

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [changingPasswordId, setChangingPasswordId] = useState("");
    const [updatingStatusId, setUpdatingStatusId] = useState("");
    const [deletingUserId, setDeletingUserId] = useState("");
    const [updatingTrainingId, setUpdatingTrainingId] = useState("");
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [dependencyFilter, setDependencyFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [accessFilter, setAccessFilter] = useState("");
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const term = normalize(search.trim());
    const filteredUsuarios = usuarios.filter((u) =>
        (!term || normalize(`${u.nombreCompleto} ${u.correo} ${u.cargo || ""}`).includes(term)) &&
        (!roleFilter || u.rol === roleFilter) &&
        (!dependencyFilter || (u.dependencia || "Sin dependencia") === dependencyFilter) &&
        (!statusFilter || u.activo === (statusFilter === "activo")) &&
        (!accessFilter || u.esCuentaGoogle === (accessFilter === "google")))
        .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, "es"));
    const roleOptions = [...new Set(usuarios.map((u) => u.rol))].sort();
    const dependencyOptions = [...new Set(usuarios.map((u) => u.dependencia || "Sin dependencia"))].sort();

    async function handleExportPdf() {
        try {
            setIsExportingPdf(true);
            await exportUsuariosPdf(filteredUsuarios);
        } catch (error) {
            setMessageType("error");
            setMessage(error instanceof Error ? error.message : "No fue posible generar el PDF.");
        } finally {
            setIsExportingPdf(false);
        }
    }

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [usuariosData, rolesData, dependenciasData] = await Promise.all([
                canManage ? getUsuarios() : getUsuariosConsulta(),
                canManage ? getRoles() : Promise.resolve([] as Rol[]),
                canManage ? getDependencias() : Promise.resolve([] as Dependencia[]),
            ]);

            setUsuarios(usuariosData);
            setRoles(rolesData);
            setDependencias(dependenciasData.filter((item) => item.activa));

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
    }, [rolId, canManage]);

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
                ...(dependenciaId ? { dependenciaId, cargo, tipoVinculacion } : {}),
            });

            setNombreCompleto("");
            setCorreo("");
            setPassword("");
            setDependenciaId("");
            setCargo("");
            setTipoVinculacion("Funcionario");
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

    async function handleTrainingPermission(usuario: Usuario) {
        try {
            setUpdatingTrainingId(usuario.id);
            setMessage("");

            const habilitada = !usuario.puedeGestionarFormacion;
            const duration = trainingDurations[usuario.id] ?? "30";
            const hastaUtc = habilitada && duration !== "indefinido"
                ? calculateTrainingExpiration(duration)
                : null;

            await configurarGestionFormacion(usuario.id, { habilitada, hastaUtc });
            setMessageType("success");
            setMessage(
                habilitada
                    ? `${usuario.nombreCompleto} ya puede gestionar formación.`
                    : `Se revocó la gestión de formación para ${usuario.nombreCompleto}.`
            );
            await loadData();
        } catch (error) {
            setMessageType("error");
            setMessage(error instanceof Error ? error.message : "No fue posible actualizar el permiso de formación.");
        } finally {
            setUpdatingTrainingId("");
        }
    }

    return (
        <div className="space-y-6">
            {message ? (
                <div role={messageType === "error" ? "alert" : "status"} className={`rounded-lg px-4 py-3 text-sm font-bold ${messageType === "success" ? "bg-green-50 text-[#006b2e]" : "bg-red-50 text-red-700"}`}>
                    {message}
                </div>
            ) : null}
            {canManage ? <details className="border-b border-slate-200 pb-4">
                <summary className="flex cursor-pointer items-center gap-3 text-[#006b2e]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Plus className="h-5 w-5" />
                    </div>

                    <div>
                        <h2 className="text-base font-bold">
                            Crear acceso al sistema
                        </h2>
                    </div>
                </summary>

                <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
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

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Dependencia</span>
                        <select value={dependenciaId} onChange={(event) => setDependenciaId(event.target.value)} className={inputClass}>
                            <option value="">Sin dependencia</option>
                            {dependencias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Vinculacion</span>
                        <select disabled={!dependenciaId} value={tipoVinculacion} onChange={(event) => setTipoVinculacion(event.target.value)} className={inputClass}>
                            <option value="Funcionario">Funcionario</option><option value="Contratista">Contratista</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">Cargo (opcional)</span>
                        <input disabled={!dependenciaId} value={cargo} onChange={(event) => setCargo(event.target.value)} className={inputClass} />
                    </label>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                    >
                        {isSubmitting ? "Guardando..." : "Crear usuario"}
                    </button>
                </form>
            </details> : null}

            <section className="min-w-0 py-2">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <UsersRound className="h-5 w-5" />
                        </div>

                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#006b2e]">
                                Usuarios
                            </p>
                            <h2 className="text-xl font-bold">
                                Accesos registrados
                            </h2>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={isLoading || !filteredUsuarios.length} onClick={() => exportUsuariosExcel(filteredUsuarios)} className={`${exportButtonClass} disabled:opacity-50`}><Download className="h-4 w-4" />Excel</button>
                        <button type="button" disabled={isLoading || isExportingPdf || !filteredUsuarios.length} onClick={() => void handleExportPdf()} className={`${exportButtonClass} disabled:opacity-50`}>
                            {isExportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}PDF
                        </button>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-slate-100 py-3 text-sm text-slate-600">
                    <span><strong>{usuarios.length}</strong> registrados</span>
                    <span><strong>{usuarios.filter((u) => u.activo).length}</strong> activos</span>
                    <span><strong>{usuarios.filter((u) => u.esCuentaGoogle).length}</strong> con Google</span>
                </div>
                <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <label className="relative sm:col-span-2 xl:col-span-4">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input aria-label="Buscar usuario" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo o cargo" className={`${filterClass} w-full pl-9`} />
                    </label>
                    <select aria-label="Filtrar usuarios por rol" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={filterClass}>
                        <option value="">Todos los roles</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}
                    </select>
                    <select aria-label="Filtrar usuarios por dependencia" value={dependencyFilter} onChange={(event) => setDependencyFilter(event.target.value)} className={filterClass}>
                        <option value="">Todas las dependencias</option>{dependencyOptions.map((dep) => <option key={dep}>{dep}</option>)}
                    </select>
                    <select aria-label="Filtrar usuarios por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={filterClass}>
                        <option value="">Todos los estados</option><option value="activo">Activos</option><option value="inactivo">Inactivos</option>
                    </select>
                    <select aria-label="Filtrar usuarios por acceso" value={accessFilter} onChange={(event) => setAccessFilter(event.target.value)} className={filterClass}>
                        <option value="">Todos los accesos</option><option value="google">Google</option><option value="institucional">Institucional</option>
                    </select>
                </div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <p aria-live="polite">Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios</p>
                    {search || roleFilter || dependencyFilter || statusFilter || accessFilter ? (
                        <button type="button" onClick={() => { setSearch(""); setRoleFilter(""); setDependencyFilter(""); setStatusFilter(""); setAccessFilter(""); }} className="font-bold text-[#006b2e]">Limpiar filtros</button>
                    ) : null}
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando usuarios...
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[1040px] text-left text-sm">
                            <caption className="sr-only">Usuarios registrados en SIGETIC</caption>
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="w-[21%] px-5 py-3">Usuario</th>
                                    <th className="w-[24%] px-5 py-3">Correo</th>
                                    <th className="w-[18%] px-5 py-3">Rol</th>
                                    <th className="w-[11%] px-5 py-3">Estado</th>
                                    <th className="px-5 py-3">Registro / Último ingreso</th>
                                    <th className="px-5 py-3">Acciones</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredUsuarios.map((usuario) => (
                                    <tr key={usuario.id}>
                                        <td className="px-5 py-4 align-middle font-black leading-6 text-[#14233b]">
                                            {usuario.nombreCompleto}
                                            <span className="mt-1 block text-xs font-normal text-slate-500">{usuario.tipoVinculacion || "Sin vinculación"}</span>
                                            {usuario.esCuentaGoogle ? (
                                                <span className="mt-1 block text-xs font-bold text-[#006b2e]">Cuenta Google</span>
                                            ) : null}
                                        </td>
                                        <td className="px-5 py-4 align-middle text-slate-600">
                                            {usuario.correo}
                                        </td>
                                        <td className="px-5 py-4 align-middle text-slate-600">
                                            {usuario.rol}
                                            {usuario.dependencia ? (
                                                <span className="mt-1 block text-xs text-slate-500">{usuario.dependencia}{usuario.cargo ? ` · ${usuario.cargo}` : ""}</span>
                                            ) : null}
                                            {usuario.puedeGestionarFormacion ? (
                                                <span className="mt-1 block text-xs font-bold text-[#006b2e]">
                                                    Gestor de formación{usuario.gestionFormacionHastaUtc ? ` hasta ${new Date(usuario.gestionFormacionHastaUtc).toLocaleDateString("es-CO")}` : ""}
                                                </span>
                                            ) : null}
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
                                        <td className="whitespace-nowrap px-5 py-4 align-middle text-xs text-slate-600">
                                            <p>{formatUserDate(usuario.fechaCreacionUtc)}</p>
                                            <p className="mt-1 text-slate-500">{formatUserDate(usuario.ultimoAccesoUtc)}</p>
                                        </td>
                                        <td className="px-5 py-4 align-middle">
                                            {canManage ? <details>
                                                <summary className="cursor-pointer whitespace-nowrap text-xs font-bold text-[#006b2e]"><Settings2 className="mr-1 inline h-4 w-4" />Administrar</summary>
                                            <div className="mt-3 grid min-w-60 gap-2">
                                                {!(["Administrador", "Administrador TIC", "Tecnico TIC", "Auxiliar de Sistemas"].includes(usuario.rol)) ? (
                                                    <div className="flex items-center gap-2">
                                                        {!usuario.puedeGestionarFormacion ? (
                                                            <select value={trainingDurations[usuario.id] ?? "30"} onChange={(event) => setTrainingDurations((current) => ({ ...current, [usuario.id]: event.target.value }))} className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold">
                                                                <option value="7">7 días</option>
                                                                <option value="30">30 días</option>
                                                                <option value="90">90 días</option>
                                                                <option value="indefinido">Indefinido</option>
                                                            </select>
                                                        ) : null}
                                                        <button type="button" onClick={() => handleTrainingPermission(usuario)} disabled={updatingTrainingId === usuario.id} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black ${usuario.puedeGestionarFormacion ? "bg-amber-50 text-amber-700" : "bg-green-50 text-[#006b2e]"}`}>
                                                            <GraduationCap className="h-4 w-4" />
                                                            {usuario.puedeGestionarFormacion ? "Revocar formación" : "Autorizar formación"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-500">Gestiona formación por su rol.</p>
                                                )}
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
                                            </details> : <span className="text-xs text-slate-500">Solo consulta</span>}
                                        </td>
                                    </tr>
                                ))}
                                {!filteredUsuarios.length ? <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">{usuarios.length ? "No hay usuarios con estos filtros." : "No hay usuarios registrados."}</td></tr> : null}
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

const filterClass = "h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700";
const exportButtonClass = "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-[#006b2e] hover:bg-green-50";
