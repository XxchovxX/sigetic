"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FileCheck2, FileText, Plus, RefreshCw } from "lucide-react";
import { api, fechaColombia, obtenerPdf, type Documento } from "./documentos-api";
import NuevoDocumento, { accion, entrada, secundaria } from "./nuevo-documento";

const panel = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
const fecha = (valor: string) => fechaColombia.format(new Date(valor));
const referencia = (id: string) => id.replaceAll("-", "");

function estado(doc: Documento) {
    if (doc.canceladoUtc) return "Cancelado";
    if (doc.sha256Final) return "Firmado";
    return doc.puedeFirmar ? "Pendiente de mi firma" : "En espera de otra firma";
}

export default function DocumentosFirmaPage() {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [seleccion, setSeleccion] = useState("");
    const [nuevo, setNuevo] = useState(false);
    const [consulta, setConsulta] = useState("");
    const [ocupado, setOcupado] = useState(true);
    const [error, setError] = useState("");
    const actual = documentos.find((doc) => doc.id === seleccion);

    useEffect(() => {
        let vigente = true;
        void api<Documento[]>().then((lista) => {
            if (vigente) setDocumentos(lista);
        }).catch((e: Error) => {
            if (vigente) setError(e.message);
        }).finally(() => {
            if (vigente) setOcupado(false);
        });
        return () => { vigente = false; };
    }, []);

    function actualizar(doc: Documento) {
        setDocumentos((p) => p.some((d) => d.id === doc.id)
            ? p.map((d) => d.id === doc.id ? doc : d)
            : [doc, ...p]);
        setSeleccion(doc.id);
    }

    async function cargar(evento?: FormEvent<HTMLFormElement>) {
        evento?.preventDefault();
        setOcupado(true);
        setError("");
        try {
            if (evento) {
                const id = consulta.trim().toLowerCase().replaceAll("-", "");
                if (!/^[0-9a-f]{32}$/.test(id)) throw new Error("Ingresa el identificador que aparece en la constancia.");
                actualizar(await api<Documento>(`/${id}`));
            } else {
                const lista = await api<Documento[]>();
                const detalle = seleccion && !lista.some((d) => d.id === seleccion)
                    ? await api<Documento>(`/${seleccion}`)
                    : null;
                setDocumentos(detalle ? [detalle, ...lista] : lista);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo consultar la bandeja.");
        } finally {
            setOcupado(false);
        }
    }

    return (
        <div className="space-y-5">
            <section className="flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-[#006b2e] p-6 text-white sm:p-8">
                <div>
                    <FileCheck2 className="mb-3 h-7 w-7" aria-hidden="true" />
                    <h2 className="text-3xl font-black tracking-tight">Documentos para firmar</h2>
                    <p className="mt-2 max-w-xl text-sm text-green-50">Revisa tus documentos, confirma tu firma por correo y consulta las constancias de SIGETIC.</p>
                </div>
                {!nuevo && <button type="button" onClick={() => setNuevo(true)} className={`${secundaria} inline-flex items-center gap-2`}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Diligenciar documento
                </button>}
            </section>
            {nuevo ? (
                <NuevoDocumento cerrar={() => setNuevo(false)} creado={(doc) => { actualizar(doc); setNuevo(false); }} />
            ) : (
                <div className="grid items-start gap-5 xl:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
                    <section className={`${panel} space-y-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="text-lg font-black">Mi bandeja</h2>
                            <button type="button" onClick={() => void cargar()} disabled={ocupado} className={`${secundaria} inline-flex items-center gap-2`}>
                                <RefreshCw className="h-4 w-4" aria-hidden="true" /> Actualizar
                            </button>
                        </div>
                        <form onSubmit={cargar} className="flex flex-wrap items-end gap-2">
                            <label className="min-w-40 grow text-sm font-semibold">
                                Buscar por identificador
                                <input className={entrada} value={consulta} onChange={(e) => setConsulta(e.target.value)} maxLength={36} required />
                            </label>
                            <button className={secundaria} disabled={ocupado}>Buscar</button>
                        </form>
                        {ocupado && <p role="status" className="text-sm text-slate-600">Consultando documentos…</p>}
                        {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
                        {!ocupado && !error && documentos.length === 0 && <p className="text-sm text-slate-600">Aún no tienes documentos en la bandeja.</p>}
                        <ul className="max-h-[34rem] space-y-2 overflow-y-auto">
                            {documentos.map((doc) => (
                                <li key={doc.id}>
                                    <button type="button" aria-pressed={seleccion === doc.id} onClick={() => setSeleccion(doc.id)}
                                        className={`w-full rounded-xl border p-3 text-left hover:border-green-700 ${seleccion === doc.id ? "border-green-700 bg-green-50" : "border-slate-200"}`}>
                                        <span className="block text-xs font-semibold text-[#006b2e]">{doc.tipo} · {estado(doc)}</span>
                                        <span className="mt-1 block break-words text-sm font-bold">{doc.titulo}</span>
                                        <span className="mt-1 block text-xs text-slate-600">{fecha(doc.creadoUtc)}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                    {actual ? <Detalle key={actual.id} doc={actual} actualizar={actualizar} /> :
                        <p className={`${panel} text-sm text-slate-600`}>Selecciona un documento para revisar su contenido o consultar su constancia.</p>}
                </div>
            )}
        </div>
    );
}

function Detalle({ doc, actualizar }: { doc: Documento; actualizar: (doc: Documento) => void }) {
    const [pdf, setPdf] = useState<{ url: string; final: boolean } | null>(null);
    const [enviado, setEnviado] = useState<{ correo: string; venceUtc: string } | null>(null);
    const [codigo, setCodigo] = useState("");
    const [acepta, setAcepta] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        return () => { if (pdf?.url) URL.revokeObjectURL(pdf.url); };
    }, [pdf]);

    async function operar(operacion: () => Promise<void>) {
        setOcupado(true);
        setError("");
        setMensaje("");
        try {
            await operacion();
        } catch (e) {
            setError(e instanceof Error ? e.message : "SIGETIC no pudo completar la operación.");
        } finally {
            setOcupado(false);
        }
    }

    async function abrirPdf(final: boolean) {
        const archivo = await obtenerPdf(doc.id, final);
        setPdf({ url: URL.createObjectURL(archivo), final });
    }

    async function solicitarCodigo() {
        setCodigo("");
        setEnviado(await api(`/${doc.id}/codigo`, {}));
    }

    async function firmar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        await operar(async () => {
            const actualizado = await api<Documento>(`/${doc.id}/firmar`, { codigo, acepta, sha256: doc.sha256 });
            actualizar(actualizado);
            setEnviado(null);
            setCodigo("");
            setAcepta(false);
            setMensaje(actualizado.sha256Final ? "Documento firmado. Ya puedes descargar el PDF con su constancia." : "Tu firma quedó registrada. La constancia se generará al completar las firmas.");
        });
    }

    async function verificar(archivo?: File) {
        if (!archivo) return;
        await operar(async () => {
            if (!globalThis.crypto?.subtle) throw new Error("Abre SIGETIC mediante HTTPS para comprobar la huella.");
            if (archivo.size > 24 * 1024 * 1024) throw new Error("El archivo supera el tamaño permitido para la comprobación.");
            const digest = await crypto.subtle.digest("SHA-256", await archivo.arrayBuffer());
            const huella = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
            if (huella !== doc.sha256Final) throw new Error("El PDF seleccionado es diferente de la copia firmada que conserva SIGETIC.");
            setMensaje("Verificado. La huella coincide con la del PDF firmado que conserva SIGETIC.");
        });
    }

    return (
        <section className={`${panel} min-w-0 space-y-5`}>
            <div>
                <p className="text-sm font-bold text-[#006b2e]">{estado(doc)}</p>
                <h2 className="mt-1 break-words text-xl font-black">{doc.titulo}</h2>
                <p className="mt-2 break-all text-xs text-slate-600">Identificador {referencia(doc.id)}</p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
                {doc.firmantes.map((f) => (
                    <li className="rounded-xl bg-slate-50 p-3 text-sm" key={f.rol}>
                        <p className="text-xs font-semibold text-slate-600">{f.rol}</p>
                        <p className="mt-1 break-words font-bold">{f.nombre}</p>
                        {f.cargo && <p className="break-words text-slate-600">{f.cargo}</p>}
                        <p className="mt-1 text-xs text-[#006b2e]">{f.fechaUtc ? `Firmó el ${fecha(f.fechaUtc)}` : doc.canceladoUtc ? "Cancelado" : "Pendiente de firma"}</p>
                    </li>
                ))}
            </ul>
            <div className="flex flex-wrap gap-2">
                <button type="button" className={`${secundaria} inline-flex items-center gap-2`} disabled={ocupado} onClick={() => void operar(() => abrirPdf(false))}>
                    <FileText className="h-4 w-4" aria-hidden="true" /> Revisar PDF
                </button>
                {doc.sha256Final && <button type="button" className={accion} disabled={ocupado} onClick={() => void operar(() => abrirPdf(true))}>Abrir PDF con constancia</button>}
                {doc.puedeCancelar && <button type="button" className={secundaria} disabled={ocupado}
                    onClick={() => {
                        if (window.confirm("¿Cancelar este documento? Tendrás que registrar uno nuevo para solicitar las firmas.")) {
                            void operar(async () => actualizar(await api<Documento>(`/${doc.id}/cancelar`, {})));
                        }
                    }}>Cancelar solicitud</button>}
            </div>
            {pdf && (
                <div className="space-y-2">
                    <a className="inline-block text-sm font-bold text-[#006b2e] underline"
                        href={pdf.url} download={`SIGETIC-${referencia(doc.id)}${pdf.final ? "-firmado" : ""}.pdf`}>Descargar {pdf.final ? "PDF firmado" : "PDF para revisión"}</a>
                    <iframe key={pdf.url} title={pdf.final ? "PDF con constancia de firma" : "PDF para revisión"} src={pdf.url}
                        className="h-[34rem] w-full rounded-xl border border-slate-200 bg-slate-100" />
                </div>
            )}
            {doc.puedeFirmar && (
                <form onSubmit={firmar} className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-4">
                    <h3 className="font-bold">Confirmar firma electrónica</h3>
                    {!pdf && <p className="text-sm text-slate-700">Abre el PDF y revisa su contenido para continuar.</p>}
                    {pdf && (
                        <>
                            <label className="flex items-start gap-2 text-sm">
                                <input type="checkbox" className="mt-0.5" required checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
                                {doc.acuerdo}
                            </label>
                            <p className="break-all text-xs text-slate-600">SHA-256 {doc.sha256}</p>
                            <button type="button" className={secundaria} disabled={!acepta || ocupado} onClick={() => void operar(solicitarCodigo)}>
                                {enviado ? "Solicitar otro código" : "Enviar código a mi correo"}
                            </button>
                            {enviado && (
                                <div className="space-y-3">
                                    <p className="text-sm text-slate-700">Código enviado a {enviado.correo}. Vence el {fecha(enviado.venceUtc)}.</p>
                                    <label className="block max-w-xs text-sm font-semibold">
                                        Código de seguridad
                                        <input className={entrada} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ""))}
                                            required pattern="[0-9]{6}" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                                    </label>
                                    <button type="submit" className={accion} disabled={!acepta || codigo.length !== 6 || ocupado}>Firmar electrónicamente</button>
                                </div>
                            )}
                        </>
                    )}
                </form>
            )}
            {doc.sha256Final && (
                <div className="rounded-2xl border border-slate-200 p-4">
                    <h3 className="font-bold">Verificar una copia firmada</h3>
                    <p className="mt-1 break-all text-xs text-slate-600">SHA-256 del PDF con constancia {doc.sha256Final}</p>
                    <label className="mt-3 block text-sm font-semibold">
                        Selecciona el PDF que quieres cotejar
                        <input className={entrada} type="file" accept=".pdf,application/pdf" disabled={ocupado}
                            onChange={(e) => { const archivo = e.target.files?.[0]; e.target.value = ""; void verificar(archivo); }} />
                    </label>
                </div>
            )}
            {ocupado && <p role="status" className="text-sm text-slate-600">Procesando solicitud…</p>}
            {mensaje && <p role="status" className="text-sm font-semibold text-[#006b2e]">{mensaje}</p>}
            {error && <p role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
        </section>
    );
}
