"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, BriefcaseBusiness, Save, UserRoundCheck } from "lucide-react";
import {
    completarPerfil,
    getPerfilDependencias,
    getStoredUser,
    saveSession,
    type PerfilDependencia,
} from "@/lib/auth";

export default function CompletarPerfilPage() {
    const router = useRouter();
    const user = getStoredUser();
    const [dependencias, setDependencias] = useState<PerfilDependencia[]>([]);
    const [dependenciaId, setDependenciaId] = useState("");
    const [cargo, setCargo] = useState("");
    const [tipoVinculacion, setTipoVinculacion] = useState("Funcionario");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getPerfilDependencias()
            .then((items) => {
                setDependencias(items);
                setDependenciaId(items[0]?.id ?? "");
            })
            .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar las dependencias."));
    }, []);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            setSaving(true);
            setError("");
            const response = await completarPerfil({ dependenciaId, cargo, tipoVinculacion });
            saveSession(response);
            router.replace("/formacion");
        } catch (err) {
            setError(err instanceof Error ? err.message : "No fue posible completar el perfil.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl py-8">
            <section className="mb-5 border-b border-green-900/10 pb-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#006b2e]">Registro institucional</p>
                <h1 className="mt-2 text-3xl font-black text-[#14233b]">Completa tu perfil</h1>
                <p className="mt-2 text-sm text-slate-500">
                    Google confirmó la identidad de {user?.nombreCompleto}. Estos datos permiten asignarte formaciones y registrar tus solicitudes.
                </p>
            </section>

            <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50 text-[#006b2e]"><UserRoundCheck className="h-5 w-5" /></div>
                    <div><p className="font-black">{user?.nombreCompleto}</p><p className="text-sm text-slate-500">{user?.correo}</p></div>
                </div>

                <label className="block text-sm font-bold text-slate-700">
                    Dependencia o secretaría
                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <select required value={dependenciaId} onChange={(e) => setDependenciaId(e.target.value)} className="h-12 w-full bg-transparent outline-none">
                            {dependencias.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
                        </select>
                    </div>
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-bold text-slate-700">
                        Cargo
                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 px-3">
                            <BriefcaseBusiness className="h-4 w-4 text-slate-400" />
                            <input required value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Profesional universitario" className="h-12 w-full bg-transparent outline-none" />
                        </div>
                    </label>
                    <label className="text-sm font-bold text-slate-700">
                        Tipo de vinculación
                        <select required value={tipoVinculacion} onChange={(e) => setTipoVinculacion(e.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3 outline-none">
                            <option>Funcionario</option>
                            <option>Contratista</option>
                        </select>
                    </label>
                </div>

                {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
                <button disabled={saving || !dependenciaId} className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#006b2e] px-5 text-sm font-black text-white disabled:opacity-60">
                    <Save className="h-4 w-4" />{saving ? "Guardando..." : "Guardar y continuar"}
                </button>
            </form>
        </div>
    );
}
