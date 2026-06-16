"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Download, FileText, Package, Pencil, Plus } from "lucide-react";
import { getDependencias, type Dependencia } from "@/lib/administracion-api";
import { getImpresoras, type Impresora } from "@/lib/impresoras-api";
import { exportConsumiblePdf } from "@/lib/pdf-consumible";
import {
    createMovimientoConsumible,
    getConsumible,
    getMovimientosConsumible,
    type Consumible,
    type MovimientoConsumible,
} from "@/lib/consumibles-api";

function today() {
    return new Date().toISOString().slice(0, 10);
}

const currencyFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
    return currencyFormatter.format(value || 0);
}

export default function DetalleConsumiblePage() {
    const params = useParams<{ id: string }>();
    const consumibleId = params.id;

    const [consumible, setConsumible] = useState<Consumible | null>(null);
    const [movimientos, setMovimientos] = useState<MovimientoConsumible[]>([]);
    const [dependencias, setDependencias] = useState<Dependencia[]>([]);
    const [impresoras, setImpresoras] = useState<Impresora[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState("");

    const [fechaMovimiento, setFechaMovimiento] = useState(today());
    const [tipoMovimiento, setTipoMovimiento] = useState("Entrada");
    const [cantidad, setCantidad] = useState("1");
    const [responsable, setResponsable] = useState("");
    const [destino, setDestino] = useState("");
    const [dependenciaId, setDependenciaId] = useState("");
    const [impresoraId, setImpresoraId] = useState("");
    const [documentoSoporte, setDocumentoSoporte] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [costoUnitario, setCostoUnitario] = useState("");

    async function refreshData(showLoading = true) {
        try {
            if (showLoading) {
                setIsLoading(true);
            }
            const [consumibleData, movimientosData, dependenciasData, impresorasData] =
                await Promise.all([
                    getConsumible(consumibleId),
                    getMovimientosConsumible(consumibleId),
                    getDependencias(),
                    getImpresoras(),
                ]);

            setConsumible(consumibleData);
            setMovimientos(movimientosData);
            setDependencias(dependenciasData);
            setImpresoras(impresorasData);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar el consumible."
            );
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            try {
                setIsLoading(true);
                setMessage("");
                const [consumibleData, movimientosData, dependenciasData, impresorasData] =
                    await Promise.all([
                        getConsumible(consumibleId),
                        getMovimientosConsumible(consumibleId),
                        getDependencias(),
                        getImpresoras(),
                    ]);

                if (ignore) return;

                setConsumible(consumibleData);
                setMovimientos(movimientosData);
                setDependencias(dependenciasData);
                setImpresoras(impresorasData);
            } catch (error) {
                if (ignore) return;

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar el consumible."
                );
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadData();

        return () => {
            ignore = true;
        };
    }, [consumibleId]);

    async function handleMovimientoSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setMessage("");
            await createMovimientoConsumible(consumibleId, {
                fechaMovimiento,
                tipoMovimiento,
                cantidad: Number(cantidad),
                responsable,
                destino: destino || null,
                dependenciaId: dependenciaId || null,
                impresoraId: impresoraId || null,
                documentoSoporte: documentoSoporte || null,
                observaciones: observaciones || null,
                costoUnitario: costoUnitario ? Number(costoUnitario) : null,
            });

            setCantidad("1");
            setResponsable("");
            setDestino("");
            setDependenciaId("");
            setImpresoraId("");
            setDocumentoSoporte("");
            setObservaciones("");
            setCostoUnitario("");
            setMessage("Movimiento registrado correctamente.");
            await refreshData(false);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar el movimiento."
            );
        }
    }

    async function handleExportPdf() {
        if (!consumible) return;
        await exportConsumiblePdf({ consumible, movimientos });
    }

    if (isLoading) {
        return (
            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-black text-slate-500">
                    Cargando hoja de vida del consumible...
                </p>
            </div>
        );
    }

    if (!consumible) {
        return (
            <div className="rounded-[1.7rem] border border-red-100 bg-red-50 p-8 text-center">
                <p className="text-sm font-black text-red-700">
                    No se encontró el consumible solicitado.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Hoja de vida de consumible
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                            {consumible.codigoInterno} · {consumible.nombre}
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            {consumible.tipoConsumible} · {consumible.referencia} ·{" "}
                            {consumible.color}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link href={`/consumibles/${consumible.id}/editar`} className={whiteButtonClass}>
                            <Pencil className="h-4 w-4" />
                            Editar
                        </Link>
                        <button type="button" onClick={handleExportPdf} className={whiteButtonClass}>
                            <Download className="h-4 w-4" />
                            PDF
                        </button>
                    </div>
                </div>
            </section>

            {message ? (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                    {message}
                </div>
            ) : null}

            {consumible.bajoStock ? (
                <div className="flex items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-black text-yellow-800">
                    <AlertTriangle className="h-5 w-5" />
                    Stock bajo: el stock actual está en {consumible.stockActual} y el mínimo es {consumible.stockMinimo}.
                </div>
            ) : null}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard title="Stock actual" value={`${consumible.stockActual} ${consumible.unidadMedida}`} icon={Package} />
                <InfoCard title="Stock mínimo" value={String(consumible.stockMinimo)} icon={AlertTriangle} />
                <InfoCard title="Costo unitario" value={formatCurrency(consumible.costoUnitario)} icon={FileText} />
                <InfoCard title="Estado" value={consumible.activo ? "Activo" : "Inactivo"} icon={FileText} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={Package} eyebrow="Datos maestros" title="Información general" />
                    <dl className="grid gap-4 text-sm">
                        <InfoRow label="Código interno" value={consumible.codigoInterno} />
                        <InfoRow label="Tipo" value={consumible.tipoConsumible} />
                        <InfoRow label="Referencia" value={consumible.referencia} />
                        <InfoRow label="Color" value={consumible.color} />
                        <InfoRow label="Marca compatible" value={consumible.marcaCompatible ?? "Sin registro"} />
                        <InfoRow label="Modelos compatibles" value={consumible.modelosCompatibles ?? "Sin registro"} />
                        <InfoRow label="Observaciones" value={consumible.observaciones ?? "Sin observaciones"} />
                    </dl>
                </section>

                <form onSubmit={handleMovimientoSubmit} className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionTitle icon={Plus} eyebrow="Kardex" title="Registrar movimiento" />
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tipo">
                            <select value={tipoMovimiento} onChange={(event) => setTipoMovimiento(event.target.value)} className={inputClass}>
                                <option>Entrada</option>
                                <option>Salida</option>
                                <option>Ajuste</option>
                            </select>
                        </Field>
                        <Field label="Fecha">
                            <input type="date" value={fechaMovimiento} onChange={(event) => setFechaMovimiento(event.target.value)} className={inputClass} />
                        </Field>
                        <Field label={tipoMovimiento === "Ajuste" ? "Nuevo stock" : "Cantidad"}>
                            <input type="number" min="1" value={cantidad} onChange={(event) => setCantidad(event.target.value)} className={inputClass} />
                        </Field>
                        <Field label="Responsable">
                            <input value={responsable} onChange={(event) => setResponsable(event.target.value)} placeholder="Nombre del responsable" className={inputClass} />
                        </Field>
                        <Field label="Destino">
                            <input value={destino} onChange={(event) => setDestino(event.target.value)} placeholder="Inventario, dependencia o uso" className={inputClass} />
                        </Field>
                        <Field label="Documento soporte">
                            <input value={documentoSoporte} onChange={(event) => setDocumentoSoporte(event.target.value)} placeholder="Acta, factura, remisión" className={inputClass} />
                        </Field>
                        <Field label="Costo unitario opcional">
                            <input type="number" min="0" step="0.01" value={costoUnitario} onChange={(event) => setCostoUnitario(event.target.value)} placeholder={String(consumible.costoUnitario)} className={inputClass} />
                        </Field>
                        <Field label="Dependencia opcional">
                            <select value={dependenciaId} onChange={(event) => setDependenciaId(event.target.value)} className={inputClass}>
                                <option value="">Sin dependencia</option>
                                {dependencias.map((item) => (
                                    <option key={item.id} value={item.id}>{item.nombre}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Impresora opcional">
                            <select value={impresoraId} onChange={(event) => setImpresoraId(event.target.value)} className={inputClass}>
                                <option value="">Sin impresora</option>
                                {impresoras.map((item) => (
                                    <option key={item.id} value={item.id}>{item.codigoInterno} - {item.marca} {item.modelo}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                    <div className="mt-4">
                        <Field label="Observaciones">
                            <textarea value={observaciones} onChange={(event) => setObservaciones(event.target.value)} rows={3} className={textareaClass} />
                        </Field>
                    </div>
                    <button type="submit" className={buttonClass}>
                        <Plus className="h-4 w-4" />
                        Registrar movimiento
                    </button>
                </form>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <SectionTitle icon={FileText} eyebrow="Trazabilidad" title="Movimientos registrados" />
                {movimientos.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                        <p className="text-sm font-bold text-slate-500">No hay movimientos registrados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                        <table className="w-full min-w-[900px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Tipo</th>
                                    <th className="px-4 py-3">Cantidad</th>
                                    <th className="px-4 py-3">Responsable</th>
                                    <th className="px-4 py-3">Destino</th>
                                    <th className="px-4 py-3">Costo</th>
                                    <th className="px-4 py-3">Stock resultante</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movimientos.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 font-bold text-[#14233b]">{item.fechaMovimiento}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.tipoMovimiento}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.cantidad}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.responsable}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.impresora ?? item.dependencia ?? item.destino ?? "Inventario"}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatCurrency(item.costoTotal)}</td>
                                        <td className="px-4 py-3 font-black text-[#006b2e]">{item.stockResultante}</td>
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

function InfoCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="mt-1 text-sm font-black text-[#14233b]">{value}</p>
                </div>
            </div>
        </article>
    );
}

function SectionTitle({ icon: Icon, eyebrow, title }: { icon: React.ElementType; eyebrow: string; title: string }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">{eyebrow}</p>
                <h2 className="text-xl font-black tracking-[-0.03em]">{title}</h2>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 font-bold text-[#14233b]">{value}</dd>
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
const buttonClass = "mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20";
const whiteButtonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5";
