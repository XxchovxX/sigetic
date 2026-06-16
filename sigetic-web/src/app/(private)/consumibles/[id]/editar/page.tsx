"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { getConsumible, updateConsumible, type Consumible } from "@/lib/consumibles-api";

export default function EditarConsumiblePage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const consumibleId = params.id;

    const [consumible, setConsumible] = useState<Consumible | null>(null);
    const [codigoInterno, setCodigoInterno] = useState("");
    const [nombre, setNombre] = useState("");
    const [tipoConsumible, setTipoConsumible] = useState("Tinta");
    const [referencia, setReferencia] = useState("");
    const [color, setColor] = useState("Negro");
    const [unidadMedida, setUnidadMedida] = useState("Unidad");
    const [stockMinimo, setStockMinimo] = useState("1");
    const [costoUnitario, setCostoUnitario] = useState("0");
    const [marcaCompatible, setMarcaCompatible] = useState("");
    const [modelosCompatibles, setModelosCompatibles] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [activo, setActivo] = useState(true);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setMessage("");
                const data = await getConsumible(consumibleId);
                setConsumible(data);
                setCodigoInterno(data.codigoInterno);
                setNombre(data.nombre);
                setTipoConsumible(data.tipoConsumible);
                setReferencia(data.referencia);
                setColor(data.color);
                setUnidadMedida(data.unidadMedida);
                setStockMinimo(String(data.stockMinimo));
                setCostoUnitario(String(data.costoUnitario ?? 0));
                setMarcaCompatible(data.marcaCompatible ?? "");
                setModelosCompatibles(data.modelosCompatibles ?? "");
                setObservaciones(data.observaciones ?? "");
                setActivo(data.activo);
            } catch (error) {
                setMessage(error instanceof Error ? error.message : "No fue posible cargar el consumible.");
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [consumibleId]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");
            await updateConsumible(consumibleId, {
                codigoInterno,
                nombre,
                tipoConsumible,
                referencia,
                color,
                unidadMedida,
                stockMinimo: Number(stockMinimo),
                costoUnitario: Number(costoUnitario),
                marcaCompatible: marcaCompatible || null,
                modelosCompatibles: modelosCompatibles || null,
                observaciones: observaciones || null,
                activo,
            });

            router.push(`/consumibles/${consumibleId}`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "No fue posible actualizar el consumible.");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-black text-slate-500">Cargando consumible...</p>
            </div>
        );
    }

    if (!consumible) {
        return (
            <div className="rounded-[1.7rem] border border-red-100 bg-red-50 p-8 text-center">
                <p className="text-sm font-black text-red-700">No se encontró el consumible solicitado.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Actualización de consumible
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                            Editar consumible
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Actualiza datos generales. El stock solo cambia mediante movimientos tipo ajuste.
                        </p>
                    </div>
                    <Link href={`/consumibles/${consumibleId}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/20 transition hover:-translate-y-0.5">
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Link>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <Package className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">Datos generales</p>
                        <h2 className="text-xl font-black tracking-[-0.03em]">{consumible.codigoInterno} · Stock actual {consumible.stockActual}</h2>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Código interno"><input value={codigoInterno} onChange={(event) => setCodigoInterno(event.target.value)} className={inputClass} /></Field>
                    <Field label="Nombre"><input value={nombre} onChange={(event) => setNombre(event.target.value)} className={inputClass} /></Field>
                    <Field label="Tipo de consumible">
                        <select value={tipoConsumible} onChange={(event) => setTipoConsumible(event.target.value)} className={inputClass}>
                            <option>Tinta</option><option>Tóner</option><option>Tambor</option><option>Botella residual</option><option>Repuesto</option><option>Otro</option>
                        </select>
                    </Field>
                    <Field label="Referencia"><input value={referencia} onChange={(event) => setReferencia(event.target.value)} className={inputClass} /></Field>
                    <Field label="Color">
                        <select value={color} onChange={(event) => setColor(event.target.value)} className={inputClass}>
                            <option>Negro</option><option>Cian</option><option>Magenta</option><option>Amarillo</option><option>Multicolor</option><option>No aplica</option>
                        </select>
                    </Field>
                    <Field label="Unidad de medida">
                        <select value={unidadMedida} onChange={(event) => setUnidadMedida(event.target.value)} className={inputClass}>
                            <option>Unidad</option><option>Caja</option><option>Kit</option><option>Botella</option><option>Paquete</option>
                        </select>
                    </Field>
                    <Field label="Stock mínimo"><input type="number" min="0" value={stockMinimo} onChange={(event) => setStockMinimo(event.target.value)} className={inputClass} /></Field>
                    <Field label="Costo unitario"><input type="number" min="0" step="0.01" value={costoUnitario} onChange={(event) => setCostoUnitario(event.target.value)} className={inputClass} /></Field>
                    <Field label="Estado">
                        <select value={activo ? "Activo" : "Inactivo"} onChange={(event) => setActivo(event.target.value === "Activo")} className={inputClass}>
                            <option>Activo</option><option>Inactivo</option>
                        </select>
                    </Field>
                    <Field label="Marca compatible"><input value={marcaCompatible} onChange={(event) => setMarcaCompatible(event.target.value)} className={inputClass} /></Field>
                    <Field label="Modelos compatibles"><input value={modelosCompatibles} onChange={(event) => setModelosCompatibles(event.target.value)} className={inputClass} /></Field>
                </div>

                <div className="mt-4">
                    <Field label="Observaciones"><textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={4} className={textareaClass} /></Field>
                </div>

                {message ? <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{message}</div> : null}

                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-6 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70">
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Actualizando..." : "Actualizar consumible"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">{label}</span>
            {children}
        </label>
    );
}

const inputClass = "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";
const textareaClass = "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";
