"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { exportImpresoraPdf } from "@/lib/pdf-impresora";
import {
    Download,
    Droplets,
    FileText,
    Pencil,
    Plus,
    Printer,
    Wrench,
} from "lucide-react";
import {
    createHistorialConsumibleImpresora,
    createMantenimientoImpresora,
    getHistorialConsumiblesImpresora,
    getImpresora,
    getMantenimientosImpresora,
    type HistorialConsumibleImpresora,
    type Impresora,
    type MantenimientoImpresora,
} from "@/lib/impresoras-api";
import { getStoredUser } from "@/lib/auth";
import { canManageTechnicalAssets } from "@/lib/permissions";

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function DetalleImpresoraPage() {
    const params = useParams<{ id: string }>();
    const impresoraId = params.id;
    const canManageTechnical = canManageTechnicalAssets(getStoredUser());

    const [impresora, setImpresora] = useState<Impresora | null>(null);
    const [mantenimientos, setMantenimientos] = useState<MantenimientoImpresora[]>([]);
    const [consumibles, setConsumibles] = useState<HistorialConsumibleImpresora[]>([]);
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [tipoMantenimiento, setTipoMantenimiento] = useState("Preventivo");
    const [fechaMantenimiento, setFechaMantenimiento] = useState(today());
    const [tecnicoResponsable, setTecnicoResponsable] = useState("");
    const [diagnostico, setDiagnostico] = useState("");
    const [actividadesRealizadas, setActividadesRealizadas] = useState("");
    const [repuestosUtilizados, setRepuestosUtilizados] = useState("");
    const [contadorMantenimiento, setContadorMantenimiento] = useState("");
    const [estadoResultante, setEstadoResultante] = useState("Activa");
    const [proximaRevision, setProximaRevision] = useState("");
    const [observacionesMantenimiento, setObservacionesMantenimiento] = useState("");
    const [firmaTecnico, setFirmaTecnico] = useState("");
    const [firmaRecibe, setFirmaRecibe] = useState("");
    const [nombreRecibe, setNombreRecibe] = useState("");
    const [documentoRecibe, setDocumentoRecibe] = useState("");

    const [fechaMovimiento, setFechaMovimiento] = useState(today());
    const [tipoMovimiento, setTipoMovimiento] = useState("Entrega");
    const [tipoConsumible, setTipoConsumible] = useState("Tinta");
    const [referencia, setReferencia] = useState("");
    const [color, setColor] = useState("Negro");
    const [cantidad, setCantidad] = useState("1");
    const [responsableEntrega, setResponsableEntrega] = useState("");
    const [contadorConsumible, setContadorConsumible] = useState("");
    const [observacionesConsumible, setObservacionesConsumible] = useState("");

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            setMessage("");

            const [impresoraData, mantenimientosData, consumiblesData] =
                await Promise.all([
                    getImpresora(impresoraId),
                    getMantenimientosImpresora(impresoraId),
                    getHistorialConsumiblesImpresora(impresoraId),
                ]);

            setImpresora(impresoraData);
            setMantenimientos(mantenimientosData);
            setConsumibles(consumiblesData);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible cargar la hoja de vida de la impresora."
            );
        } finally {
            setIsLoading(false);
        }
    }, [impresoraId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    async function handleMantenimientoSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        try {
            setMessage("");

            await createMantenimientoImpresora(impresoraId, {
                tipoMantenimiento,
                fechaMantenimiento,
                tecnicoResponsable,
                diagnostico,
                actividadesRealizadas,
                repuestosUtilizados: repuestosUtilizados || null,
                contadorPaginas: contadorMantenimiento
                    ? Number(contadorMantenimiento)
                    : null,
                estadoResultante,
                proximaRevision: proximaRevision || null,
                observaciones: observacionesMantenimiento || null,
                firmaTecnico: firmaTecnico || null,
                firmaRecibe: firmaRecibe || null,
                nombreRecibe: nombreRecibe || null,
                documentoRecibe: documentoRecibe || null,
            });

            setTecnicoResponsable("");
            setDiagnostico("");
            setActividadesRealizadas("");
            setRepuestosUtilizados("");
            setContadorMantenimiento("");
            setEstadoResultante("Activa");
            setProximaRevision("");
            setObservacionesMantenimiento("");
            setFirmaTecnico("");
            setFirmaRecibe("");
            setNombreRecibe("");
            setDocumentoRecibe("");
            setMessage("Mantenimiento registrado correctamente.");

            await loadData();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar el mantenimiento."
            );
        }
    }

    async function handleConsumibleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setMessage("");

            await createHistorialConsumibleImpresora(impresoraId, {
                fechaMovimiento,
                tipoMovimiento,
                tipoConsumible,
                referencia,
                color,
                cantidad: Number(cantidad),
                responsableEntrega,
                contadorPaginas: contadorConsumible ? Number(contadorConsumible) : null,
                observaciones: observacionesConsumible || null,
            });

            setReferencia("");
            setColor("Negro");
            setCantidad("1");
            setResponsableEntrega("");
            setContadorConsumible("");
            setObservacionesConsumible("");
            setMessage("Movimiento de consumible registrado correctamente.");

            await loadData();
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar el consumible."
            );
        }
    }

    async function handleExportPdf() {
        if (!impresora) return;

        await exportImpresoraPdf({
            impresora,
            mantenimientos,
            consumibles,
        });
    }

    if (isLoading) {
        return (
            <div className="rounded-[1.7rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="text-sm font-black text-slate-500">
                    Cargando hoja de vida de impresora...
                </p>
            </div>
        );
    }

    if (!impresora) {
        return (
            <div className="rounded-[1.7rem] border border-red-100 bg-red-50 p-8 text-center">
                <p className="text-sm font-black text-red-700">
                    No se encontró la impresora solicitada.
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
                            Hoja de vida de impresora
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                            {impresora.codigoInterno} · {impresora.marca} {impresora.modelo}
                        </h2>

                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Serial {impresora.serial} · {impresora.dependencia} ·{" "}
                            {impresora.ubicacionFisica}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        {canManageTechnical ? (
                            <Link
                                href={`/impresoras/${impresora.id}/editar`}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5"
                            >
                                <Pencil className="h-4 w-4" />
                                Editar
                            </Link>
                        ) : null}

                        <button
                            type="button"
                            onClick={handleExportPdf}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg shadow-green-950/10 transition hover:-translate-y-0.5"
                        >
                            <Download className="h-4 w-4" />
                            Exportar PDF
                        </button>

                        <span className="inline-flex h-11 items-center justify-center rounded-2xl bg-white/90 px-5 text-sm font-black text-[#006b2e]">
                            {impresora.estado}
                        </span>
                    </div>
                </div>
            </section>

            {message ? (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                    {message}
                </div>
            ) : null}

            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard title="Tipo" value={impresora.tipoImpresora} icon={Printer} />
                <InfoCard title="Tecnología" value={impresora.tecnologiaImpresion} icon={FileText} />
                <InfoCard title="IP" value={impresora.direccionIp ?? "Sin IP"} icon={Printer} />
                <InfoCard title="Funcionario" value={impresora.funcionarioAsignado ?? "Sin asignar"} icon={Printer} />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <form
                    onSubmit={handleMantenimientoSubmit}
                    className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <SectionTitle
                        icon={Wrench}
                        eyebrow="Historial técnico"
                        title="Registrar mantenimiento"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Tipo de mantenimiento">
                            <select
                                value={tipoMantenimiento}
                                onChange={(event) => setTipoMantenimiento(event.target.value)}
                                className={inputClass}
                            >
                                <option>Preventivo</option>
                                <option>Correctivo</option>
                                <option>Diagnóstico</option>
                                <option>Limpieza</option>
                                <option>Instalación</option>
                            </select>
                        </Field>

                        <Field label="Fecha">
                            <input
                                type="date"
                                value={fechaMantenimiento}
                                onChange={(event) => setFechaMantenimiento(event.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Técnico responsable">
                            <input
                                value={tecnicoResponsable}
                                onChange={(event) => setTecnicoResponsable(event.target.value)}
                                placeholder="Nombre del técnico"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Estado resultante">
                            <select
                                value={estadoResultante}
                                onChange={(event) => setEstadoResultante(event.target.value)}
                                className={inputClass}
                            >
                                <option>Activa</option>
                                <option>En mantenimiento</option>
                                <option>Inactiva</option>
                                <option>Dada de baja</option>
                            </select>
                        </Field>

                        <Field label="Contador de páginas">
                            <input
                                type="number"
                                value={contadorMantenimiento}
                                onChange={(event) => setContadorMantenimiento(event.target.value)}
                                placeholder="Ej: 12500"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Próxima revisión">
                            <input
                                type="date"
                                value={proximaRevision}
                                onChange={(event) => setProximaRevision(event.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Recibe mantenimiento">
                            <input
                                value={nombreRecibe}
                                onChange={(event) => setNombreRecibe(event.target.value)}
                                placeholder="Nombre de quien recibe"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Documento recibe">
                            <input
                                value={documentoRecibe}
                                onChange={(event) => setDocumentoRecibe(event.target.value)}
                                placeholder="Cedula o identificacion"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <div className="mt-4 grid gap-4">
                        <Field label="Diagnóstico">
                            <textarea
                                value={diagnostico}
                                onChange={(event) => setDiagnostico(event.target.value)}
                                rows={3}
                                placeholder="Describe el diagnóstico técnico..."
                                className={textareaClass}
                            />
                        </Field>

                        <Field label="Actividades realizadas">
                            <textarea
                                value={actividadesRealizadas}
                                onChange={(event) => setActividadesRealizadas(event.target.value)}
                                rows={3}
                                placeholder="Describe las actividades ejecutadas..."
                                className={textareaClass}
                            />
                        </Field>

                        <Field label="Repuestos utilizados">
                            <textarea
                                value={repuestosUtilizados}
                                onChange={(event) => setRepuestosUtilizados(event.target.value)}
                                rows={2}
                                placeholder="Opcional"
                                className={textareaClass}
                            />
                        </Field>

                        <Field label="Observaciones">
                            <textarea
                                value={observacionesMantenimiento}
                                onChange={(event) =>
                                    setObservacionesMantenimiento(event.target.value)
                                }
                                rows={2}
                                placeholder="Opcional"
                                className={textareaClass}
                            />
                        </Field>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Firma tecnico">
                                <input
                                    value={firmaTecnico}
                                    onChange={(event) => setFirmaTecnico(event.target.value)}
                                    placeholder="Nombre/firma interna del tecnico"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Firma recibe">
                                <input
                                    value={firmaRecibe}
                                    onChange={(event) => setFirmaRecibe(event.target.value)}
                                    placeholder="Nombre/firma interna de quien recibe"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>

                    <button className={buttonClass} type="submit">
                        <Plus className="h-4 w-4" />
                        Registrar mantenimiento
                    </button>
                </form>

                <form
                    onSubmit={handleConsumibleSubmit}
                    className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <SectionTitle
                        icon={Droplets}
                        eyebrow="Control de consumibles"
                        title="Registrar tinta / tóner"
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Fecha">
                            <input
                                type="date"
                                value={fechaMovimiento}
                                onChange={(event) => setFechaMovimiento(event.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Tipo de movimiento">
                            <select
                                value={tipoMovimiento}
                                onChange={(event) => setTipoMovimiento(event.target.value)}
                                className={inputClass}
                            >
                                <option>Entrega</option>
                                <option>Instalación</option>
                                <option>Cambio</option>
                                <option>Reposición</option>
                            </select>
                        </Field>

                        <Field label="Tipo de consumible">
                            <select
                                value={tipoConsumible}
                                onChange={(event) => setTipoConsumible(event.target.value)}
                                className={inputClass}
                            >
                                <option>Tinta</option>
                                <option>Tóner</option>
                                <option>Tambor</option>
                                <option>Botella residual</option>
                                <option>Otro</option>
                            </select>
                        </Field>

                        <Field label="Color">
                            <select
                                value={color}
                                onChange={(event) => setColor(event.target.value)}
                                className={inputClass}
                            >
                                <option>Negro</option>
                                <option>Cian</option>
                                <option>Magenta</option>
                                <option>Amarillo</option>
                                <option>Multicolor</option>
                                <option>No aplica</option>
                            </select>
                        </Field>

                        <Field label="Referencia">
                            <input
                                value={referencia}
                                onChange={(event) => setReferencia(event.target.value)}
                                placeholder="Ej: 544 / 664 / 85A"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Cantidad">
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(event) => setCantidad(event.target.value)}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Responsable de entrega">
                            <input
                                value={responsableEntrega}
                                onChange={(event) => setResponsableEntrega(event.target.value)}
                                placeholder="Nombre del responsable"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Contador de páginas">
                            <input
                                type="number"
                                value={contadorConsumible}
                                onChange={(event) => setContadorConsumible(event.target.value)}
                                placeholder="Opcional"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    <div className="mt-4">
                        <Field label="Observaciones">
                            <textarea
                                value={observacionesConsumible}
                                onChange={(event) => setObservacionesConsumible(event.target.value)}
                                rows={3}
                                placeholder="Observaciones sobre el cambio o entrega..."
                                className={textareaClass}
                            />
                        </Field>
                    </div>

                    <button className={buttonClass} type="submit">
                        <Plus className="h-4 w-4" />
                        Registrar consumible
                    </button>
                </form>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <HistoryPanel
                    title="Historial de mantenimientos"
                    empty="No hay mantenimientos registrados."
                >
                    {mantenimientos.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                            <p className="text-xs font-black uppercase tracking-wide text-[#006b2e]">
                                {item.fechaMantenimiento} · {item.tipoMantenimiento}
                            </p>
                            <h3 className="mt-2 font-black text-[#14233b]">
                                {item.estadoResultante}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {item.actividadesRealizadas}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Técnico: {item.tecnicoResponsable}
                            </p>
                            {item.fechaFirmaUtc ? (
                                <p className="mt-2 text-xs font-bold text-[#006b2e]">
                                    Firma interna: {item.firmaTecnico || item.tecnicoResponsable} / {item.firmaRecibe || item.nombreRecibe || "No registrado"}
                                </p>
                            ) : null}
                        </article>
                    ))}
                </HistoryPanel>

                <HistoryPanel
                    title="Historial de consumibles"
                    empty="No hay consumibles registrados."
                >
                    {consumibles.map((item) => (
                        <article
                            key={item.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                            <p className="text-xs font-black uppercase tracking-wide text-[#006b2e]">
                                {item.fechaMovimiento} · {item.tipoMovimiento}
                            </p>
                            <h3 className="mt-2 font-black text-[#14233b]">
                                {item.tipoConsumible} {item.referencia} · {item.color}
                            </h3>
                            <p className="mt-2 text-sm text-slate-600">
                                Cantidad: {item.cantidad}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Responsable: {item.responsableEntrega}
                            </p>
                        </article>
                    ))}
                </HistoryPanel>
            </section>
        </div>
    );
}

function InfoCard({
    title,
    value,
    icon: Icon,
}: {
    title: string;
    value: string;
    icon: React.ElementType;
}) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                    <Icon className="h-5 w-5" />
                </div>

                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {title}
                    </p>
                    <p className="mt-1 text-sm font-black text-[#14233b]">{value}</p>
                </div>
            </div>
        </article>
    );
}

function SectionTitle({
    icon: Icon,
    eyebrow,
    title,
}: {
    icon: React.ElementType;
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                    {eyebrow}
                </p>
                <h2 className="text-xl font-black tracking-[-0.03em]">{title}</h2>
            </div>
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

function HistoryPanel({
    title,
    empty,
    children,
}: {
    title: string;
    empty: string;
    children: React.ReactNode;
}) {
    const hasChildren =
        Array.isArray(children) ? children.length > 0 : Boolean(children);

    return (
        <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-xl font-black tracking-[-0.03em] text-[#14233b]">
                {title}
            </h2>

            {hasChildren ? (
                <div className="grid gap-3">{children}</div>
            ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                    <p className="text-sm font-bold text-slate-500">{empty}</p>
                </div>
            )}
        </section>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

const textareaClass =
    "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

const buttonClass =
    "mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20";
