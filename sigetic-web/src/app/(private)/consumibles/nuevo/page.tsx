"use client";

import { useState } from "react";
import { Package, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { createConsumible } from "@/lib/consumibles-api";

export default function NuevoConsumiblePage() {
    const router = useRouter();

    const [codigoInterno, setCodigoInterno] = useState("");
    const [nombre, setNombre] = useState("");
    const [tipoConsumible, setTipoConsumible] = useState("Tinta");
    const [referencia, setReferencia] = useState("");
    const [color, setColor] = useState("Negro");
    const [unidadMedida, setUnidadMedida] = useState("Unidad");
    const [stockActual, setStockActual] = useState("0");
    const [stockMinimo, setStockMinimo] = useState("1");
    const [costoUnitario, setCostoUnitario] = useState("0");
    const [marcaCompatible, setMarcaCompatible] = useState("");
    const [modelosCompatibles, setModelosCompatibles] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            const created = await createConsumible({
                codigoInterno,
                nombre,
                tipoConsumible,
                referencia,
                color,
                unidadMedida,
                stockActual: Number(stockActual),
                stockMinimo: Number(stockMinimo),
                costoUnitario: Number(costoUnitario),
                marcaCompatible: marcaCompatible || null,
                modelosCompatibles: modelosCompatibles || null,
                observaciones: observaciones || null,
            });

            router.push(`/consumibles/${created.id}`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar el consumible."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                    Nuevo insumo
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                    Registrar consumible
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                    Crea el registro maestro del consumible y su stock inicial.
                </p>
            </section>

            <form
                onSubmit={handleSubmit}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
                <SectionTitle />

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Código interno">
                        <input value={codigoInterno} onChange={(event) => setCodigoInterno(event.target.value)} placeholder="Ej: TON-HP-85A" className={inputClass} />
                    </Field>
                    <Field label="Nombre">
                        <input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej: Tóner HP 85A negro" className={inputClass} />
                    </Field>
                    <Field label="Tipo de consumible">
                        <select value={tipoConsumible} onChange={(event) => setTipoConsumible(event.target.value)} className={inputClass}>
                            <option>Tinta</option>
                            <option>Tóner</option>
                            <option>Tambor</option>
                            <option>Botella residual</option>
                            <option>Repuesto</option>
                            <option>Otro</option>
                        </select>
                    </Field>
                    <Field label="Referencia">
                        <input value={referencia} onChange={(event) => setReferencia(event.target.value)} placeholder="Ej: 85A / 664 / 544" className={inputClass} />
                    </Field>
                    <Field label="Color">
                        <select value={color} onChange={(event) => setColor(event.target.value)} className={inputClass}>
                            <option>Negro</option>
                            <option>Cian</option>
                            <option>Magenta</option>
                            <option>Amarillo</option>
                            <option>Multicolor</option>
                            <option>No aplica</option>
                        </select>
                    </Field>
                    <Field label="Unidad de medida">
                        <select value={unidadMedida} onChange={(event) => setUnidadMedida(event.target.value)} className={inputClass}>
                            <option>Unidad</option>
                            <option>Caja</option>
                            <option>Kit</option>
                            <option>Botella</option>
                            <option>Paquete</option>
                        </select>
                    </Field>
                    <Field label="Stock inicial">
                        <input type="number" min="0" value={stockActual} onChange={(event) => setStockActual(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Stock mínimo">
                        <input type="number" min="0" value={stockMinimo} onChange={(event) => setStockMinimo(event.target.value)} className={inputClass} />
                    </Field>
                    <Field label="Costo unitario">
                        <input type="number" min="0" step="0.01" value={costoUnitario} onChange={(event) => setCostoUnitario(event.target.value)} placeholder="Valor unitario en pesos" className={inputClass} />
                    </Field>
                    <Field label="Marca compatible">
                        <input value={marcaCompatible} onChange={(event) => setMarcaCompatible(event.target.value)} placeholder="Ej: HP, Epson, Canon" className={inputClass} />
                    </Field>
                    <Field label="Modelos compatibles">
                        <input value={modelosCompatibles} onChange={(event) => setModelosCompatibles(event.target.value)} placeholder="Ej: LaserJet P1102, L3250" className={inputClass} />
                    </Field>
                </div>

                <div className="mt-4">
                    <Field label="Observaciones">
                        <textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={4} placeholder="Notas técnicas o administrativas..." className={textareaClass} />
                    </Field>
                </div>

                {message ? (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className={buttonClass}>
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Guardando..." : "Guardar consumible"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function SectionTitle() {
    return (
        <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Package className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                    Datos generales
                </p>
                <h2 className="text-xl font-black tracking-[-0.03em]">
                    Información del consumible
                </h2>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            {children}
        </label>
    );
}

const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";
const textareaClass = "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";
const buttonClass = "inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-6 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70";
