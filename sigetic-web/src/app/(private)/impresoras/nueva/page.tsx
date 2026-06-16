"use client";

import { useEffect, useState } from "react";
import { Save, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    getDependencias,
    getFuncionarios,
    type Dependencia,
    type Funcionario,
} from "@/lib/administracion-api";
import { createImpresora } from "@/lib/impresoras-api";

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function NuevaImpresoraPage() {
    const router = useRouter();

    const [dependencias, setDependencias] = useState<Dependencia[]>([]);
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

    const [codigoInterno, setCodigoInterno] = useState("");
    const [marca, setMarca] = useState("");
    const [modelo, setModelo] = useState("");
    const [serial, setSerial] = useState("");
    const [tipoImpresora, setTipoImpresora] = useState("Multifuncional");
    const [tecnologiaImpresion, setTecnologiaImpresion] = useState("Inyección de tinta");
    const [dependenciaId, setDependenciaId] = useState("");
    const [funcionarioAsignadoId, setFuncionarioAsignadoId] = useState("");
    const [estado, setEstado] = useState("Activa");
    const [ubicacionFisica, setUbicacionFisica] = useState("");
    const [direccionIp, setDireccionIp] = useState("");
    const [direccionMac, setDireccionMac] = useState("");
    const [fechaIngreso, setFechaIngreso] = useState(today());
    const [observaciones, setObservaciones] = useState("");

    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [dependenciasData, funcionariosData] = await Promise.all([
                    getDependencias(),
                    getFuncionarios(),
                ]);

                setDependencias(dependenciasData);
                setFuncionarios(funcionariosData);

                if (dependenciasData.length > 0) {
                    setDependenciaId(dependenciasData[0].id);
                }
            } catch (error) {
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar dependencias y funcionarios."
                );
            }
        }

        loadData();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            const created = await createImpresora({
                codigoInterno,
                marca,
                modelo,
                serial,
                tipoImpresora,
                tecnologiaImpresion,
                dependenciaId,
                funcionarioAsignadoId: funcionarioAsignadoId || null,
                estado,
                ubicacionFisica,
                direccionIp: direccionIp || null,
                direccionMac: direccionMac || null,
                fechaIngreso,
                observaciones: observaciones || null,
            });

            router.push(`/impresoras/${created.id}`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar la impresora."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                    Nueva hoja de vida
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                    Registrar impresora
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                    Ingresa los datos técnicos, dependencia, ubicación y estado inicial
                    de la impresora institucional.
                </p>
            </section>

            <form
                onSubmit={handleSubmit}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Printer className="h-5 w-5" />
                    </div>

                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Datos técnicos
                        </p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">
                            Información de la impresora
                        </h2>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Código interno">
                        <input
                            value={codigoInterno}
                            onChange={(event) => setCodigoInterno(event.target.value)}
                            placeholder="Ej: IMP-PLA-001"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Estado">
                        <select
                            value={estado}
                            onChange={(event) => setEstado(event.target.value)}
                            className={inputClass}
                        >
                            <option>Activa</option>
                            <option>En mantenimiento</option>
                            <option>Inactiva</option>
                            <option>Dada de baja</option>
                        </select>
                    </Field>

                    <Field label="Marca">
                        <input
                            value={marca}
                            onChange={(event) => setMarca(event.target.value)}
                            placeholder="Ej: Epson, HP, Canon"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Modelo">
                        <input
                            value={modelo}
                            onChange={(event) => setModelo(event.target.value)}
                            placeholder="Ej: L3250"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Serial">
                        <input
                            value={serial}
                            onChange={(event) => setSerial(event.target.value)}
                            placeholder="Serial de fábrica"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Fecha de ingreso">
                        <input
                            type="date"
                            value={fechaIngreso}
                            onChange={(event) => setFechaIngreso(event.target.value)}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Tipo de impresora">
                        <select
                            value={tipoImpresora}
                            onChange={(event) => setTipoImpresora(event.target.value)}
                            className={inputClass}
                        >
                            <option>Multifuncional</option>
                            <option>Impresora</option>
                            <option>Escáner</option>
                            <option>Plotter</option>
                            <option>Otra</option>
                        </select>
                    </Field>

                    <Field label="Tecnología de impresión">
                        <select
                            value={tecnologiaImpresion}
                            onChange={(event) => setTecnologiaImpresion(event.target.value)}
                            className={inputClass}
                        >
                            <option>Inyección de tinta</option>
                            <option>Láser</option>
                            <option>Térmica</option>
                            <option>Matriz de punto</option>
                            <option>Otra</option>
                        </select>
                    </Field>

                    <Field label="Dependencia">
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
                    </Field>

                    <Field label="Funcionario asignado">
                        <select
                            value={funcionarioAsignadoId}
                            onChange={(event) => setFuncionarioAsignadoId(event.target.value)}
                            className={inputClass}
                        >
                            <option value="">Sin funcionario asignado</option>
                            {funcionarios.map((funcionario) => (
                                <option key={funcionario.id} value={funcionario.id}>
                                    {funcionario.nombreCompleto}
                                </option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Ubicación física">
                        <input
                            value={ubicacionFisica}
                            onChange={(event) => setUbicacionFisica(event.target.value)}
                            placeholder="Ej: Secretaría de Planeación, primer piso"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Dirección IP">
                        <input
                            value={direccionIp}
                            onChange={(event) => setDireccionIp(event.target.value)}
                            placeholder="Ej: 192.168.1.50"
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Dirección MAC">
                        <input
                            value={direccionMac}
                            onChange={(event) => setDireccionMac(event.target.value)}
                            placeholder="Ej: AA-BB-CC-00-11-22"
                            className={inputClass}
                        />
                    </Field>
                </div>

                <div className="mt-4">
                    <Field label="Observaciones">
                        <textarea
                            value={observaciones}
                            onChange={(event) => setObservaciones(event.target.value)}
                            rows={4}
                            placeholder="Observaciones técnicas o administrativas..."
                            className={textareaClass}
                        />
                    </Field>
                </div>

                {message ? (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-6 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Guardando..." : "Guardar impresora"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            {children}
        </label>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

const textareaClass =
    "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";