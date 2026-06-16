"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, UsersRound } from "lucide-react";
import {
    createFuncionario,
    getDependencias,
    getFuncionarios,
    type Dependencia,
    type Funcionario,
} from "@/lib/administracion-api";

export default function FuncionariosPage() {
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [dependencias, setDependencias] = useState<Dependencia[]>([]);

    const [nombreCompleto, setNombreCompleto] = useState("");
    const [documento, setDocumento] = useState("");
    const [cargo, setCargo] = useState("");
    const [dependenciaId, setDependenciaId] = useState("");
    const [correo, setCorreo] = useState("");
    const [telefono, setTelefono] = useState("");

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [funcionariosData, dependenciasData] = await Promise.all([
                getFuncionarios(),
                getDependencias(),
            ]);

            setFuncionarios(funcionariosData);
            setDependencias(dependenciasData);

            if (!dependenciaId && dependenciasData.length > 0) {
                setDependenciaId(dependenciasData[0].id);
            }
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar los funcionarios."
            );
        } finally {
            setIsLoading(false);
        }
    }, [dependenciaId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            await createFuncionario({
                nombreCompleto,
                documento,
                cargo,
                dependenciaId,
                correo: correo || null,
                telefono: telefono || null,
            });

            setNombreCompleto("");
            setDocumento("");
            setCargo("");
            setCorreo("");
            setTelefono("");
            setMessage("Funcionario creado correctamente.");
            await loadData();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el funcionario."
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
                            Nuevo funcionario
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Registrar funcionario
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
                            placeholder="Nombre del funcionario"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Documento
                        </span>
                        <input
                            value={documento}
                            onChange={(event) => setDocumento(event.target.value)}
                            placeholder="Número de documento"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Cargo
                        </span>
                        <input
                            value={cargo}
                            onChange={(event) => setCargo(event.target.value)}
                            placeholder="Cargo institucional"
                            className={inputClass}
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Dependencia
                        </span>
                        <select
                            value={dependenciaId}
                            onChange={(event) => setDependenciaId(event.target.value)}
                            className={inputClass}
                        >
                            {dependencias.map((dependencia) => (
                                <option key={dependencia.id} value={dependencia.id}>
                                    {dependencia.nombre}
                                </option>
                            ))}
                        </select>
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

                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Teléfono
                        </span>
                        <input
                            value={telefono}
                            onChange={(event) => setTelefono(event.target.value)}
                            placeholder="Teléfono o extensión"
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
                        {isSubmitting ? "Guardando..." : "Crear funcionario"}
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
                            Funcionarios
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Personal registrado
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <p className="text-sm font-bold text-slate-500">
                        Cargando funcionarios...
                    </p>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[760px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Funcionario</th>
                                    <th className="px-4 py-3">Documento</th>
                                    <th className="px-4 py-3">Cargo</th>
                                    <th className="px-4 py-3">Dependencia</th>
                                    <th className="px-4 py-3">Estado</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {funcionarios.map((funcionario) => (
                                    <tr key={funcionario.id}>
                                        <td className="px-4 py-3 font-black text-[#14233b]">
                                            {funcionario.nombreCompleto}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {funcionario.documento}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {funcionario.cargo}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {funcionario.dependencia}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-black ${funcionario.activo
                                                        ? "bg-green-50 text-[#006b2e]"
                                                        : "bg-red-50 text-red-700"
                                                    }`}
                                            >
                                                {funcionario.activo ? "Activo" : "Inactivo"}
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
