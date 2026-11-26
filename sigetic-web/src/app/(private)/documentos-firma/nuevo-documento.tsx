"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getStoredUser } from "@/lib/auth";
import { api, type Documento, type Seccion } from "./documentos-api";

export const accion = "rounded-xl bg-[#006b2e] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005624] disabled:opacity-50";
export const secundaria = "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50";
export const entrada = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-green-700";
const guia = "mt-1 text-sm leading-relaxed text-red-800";

type Campos = Record<string, string[][]>;

function filaVacia(seccion: Seccion) {
    return seccion.campos.map(() => "");
}

export default function NuevoDocumento({ creado, cerrar }: { creado: (doc: Documento) => void; cerrar: () => void }) {
    const [modo, setModo] = useState<"formato" | "pdf">("formato");
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [campos, setCampos] = useState<Campos>({});
    const [correo, setCorreo] = useState("");
    const [correoFirmaPrincipal, setCorreoFirmaPrincipal] = useState("");
    const [titulo, setTitulo] = useState("");
    const [archivo, setArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [errorPlantilla, setErrorPlantilla] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let vigente = true;
        void api<Seccion[]>("/plantilla").then((lista) => {
            if (!vigente) return;
            const perfil = getStoredUser();
            const inicial = Object.fromEntries(lista.map((s) => [s.id, [filaVacia(s)]]));
            const general = inicial.general[0];
            general[0] = perfil?.dependencia ?? "";
            general[1] = ["Servidor público", "Contratista"].includes(perfil?.tipoVinculacion ?? "") ? perfil!.tipoVinculacion! : "";
            general[3] = perfil?.cargo ?? "";
            general[8] = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", dateStyle: "short" }).format(new Date());
            setCampos(inicial);
            setSecciones(lista);
        }).catch((e: Error) => {
            if (vigente) setErrorPlantilla(e.message);
        }).finally(() => {
            if (vigente) setCargando(false);
        });
        return () => { vigente = false; };
    }, []);

    function cambiarCampo(seccion: string, fila: number, campo: number, valor: string) {
        setCampos((previo) => ({
            ...previo,
            [seccion]: previo[seccion].map((valores, i) => i === fila
                ? valores.map((anterior, j) => j === campo ? valor : anterior)
                : valores),
        }));
    }

    async function guardar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setGuardando(true);
        setError("");
        try {
            if (modo === "formato") {
                creado(await api<Documento>("", { correoRecibe: correo, campos }));
            } else {
                if (!archivo || archivo.size > 4 * 1024 * 1024) throw new Error("Selecciona un PDF de hasta 4 MB.");
                const dataUrl = await new Promise<string>((resolve, reject) => {
                    const lector = new FileReader();
                    lector.onload = () => resolve(String(lector.result));
                    lector.onerror = () => reject(new Error("No se pudo leer el PDF."));
                    lector.readAsDataURL(archivo);
                });
                creado(await api<Documento>("", { titulo, correoFirmaPrincipal, correoRecibe: correo, pdfBase64: dataUrl.split(",")[1] }));
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo registrar el documento.");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <form onSubmit={guardar} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="text-xl font-black">Nuevo documento</h2>
                <button type="button" onClick={cerrar} disabled={guardando} className={secundaria}>Volver a la bandeja</button>
            </div>
            <label className="block text-sm font-semibold">
                Tipo de documento
                <select className={entrada} value={modo} disabled={guardando} onChange={(e) => {
                    setModo(e.target.value === "pdf" ? "pdf" : "formato"); setCorreo(""); setError("");
                }}>
                    <option value="formato">TH-F-122 · Transferencia del conocimiento</option>
                    <option value="pdf">Cargar un PDF para firma</option>
                </select>
            </label>
            {modo === "pdf" && (
                <label className="block text-sm font-semibold">
                    Correo del firmante principal
                    <input className={entrada} type="email" maxLength={180} value={correoFirmaPrincipal} onChange={(e) => setCorreoFirmaPrincipal(e.target.value)} />
                    <span className="mt-1 block font-normal text-slate-600">Deja este campo vacío si firmas con tu propia cuenta.</span>
                </label>
            )}
            <label className="block text-sm font-semibold">
                {modo === "formato" ? "Correo de quien recibe el conocimiento" : "Correo del segundo firmante (opcional)"}
                <input className={entrada} type="email" maxLength={180} required={modo === "formato"} value={correo} onChange={(e) => setCorreo(e.target.value)} />
                <span className="mt-1 block font-normal text-slate-600">Usa el correo de una cuenta activa en SIGETIC. El documento aparecerá en su bandeja.</span>
            </label>
            {modo === "pdf" ? (
                <div className="space-y-4">
                    <label className="block text-sm font-semibold">
                        Título del documento
                        <input className={entrada} value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={180} />
                    </label>
                    <label className="block text-sm font-semibold">
                        PDF para firma
                        <input className={entrada} type="file" accept="application/pdf,.pdf" required onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
                        <span className="mt-1 block font-normal text-slate-600">Hasta 4 MB y 100 páginas. Si contiene campos rellenables, exporta primero una copia para impresión y revisa el resultado antes de firmar.</span>
                    </label>
                </div>
            ) : (
                <>
                    <p className={guia}>Las guías y ejemplos en rojo son ayudas de diligenciamiento. El PDF contendrá las respuestas registradas.</p>
                    {cargando && <p role="status">Cargando el TH-F-122…</p>}
                    {errorPlantilla && <p role="alert" className={guia}>{errorPlantilla}</p>}
                    {secciones.map((seccion) => (
                        <fieldset key={seccion.id} className="min-w-0 space-y-3 rounded-2xl border border-slate-200 p-4">
                            <legend className="px-2 font-bold text-[#006b2e]">{seccion.titulo}</legend>
                            {seccion.guia && <p className={guia}>{seccion.guia}</p>}
                            {seccion.ejemplos && (
                                <details className="rounded-xl bg-red-50 p-3 text-sm text-red-900">
                                    <summary className="cursor-pointer font-semibold">Ver ejemplos de diligenciamiento</summary>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        {seccion.ejemplos.map((fila) => (
                                            <dl className="space-y-1 rounded-xl border border-red-200 p-3" key={fila[0]}>
                                                {fila.map((valor, i) => (
                                                    <div key={seccion.campos[i].etiqueta}>
                                                        <dt className="inline font-semibold">{seccion.campos[i].etiqueta} </dt>
                                                        <dd className="inline">{valor}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        ))}
                                    </div>
                                </details>
                            )}
                            {campos[seccion.id].map((fila, filaIndice) => (
                                <div key={filaIndice} className="grid gap-4 border-t border-slate-100 pt-3 sm:grid-cols-2">
                                    {seccion.campos.map((campo, i) => {
                                        const props = {
                                            className: entrada, value: fila[i], required: campo.requerido, maxLength: 600,
                                            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
                                                cambiarCampo(seccion.id, filaIndice, i, e.target.value),
                                        };
                                        return (
                                            <label key={campo.etiqueta} className="block text-sm font-semibold">
                                                {campo.etiqueta}{campo.requerido ? " *" : ""}
                                                {campo.guia && <span className={`block font-normal ${guia}`}>{campo.guia}</span>}
                                                {campo.tipo === "automatico" ? null : campo.opciones ? (
                                                    <select {...props}><option value="">Selecciona</option>{campo.opciones.map((opcion) => <option key={opcion}>{opcion}</option>)}</select>
                                                ) : campo.tipo === "fecha" ? <input {...props} type="date" /> : <textarea {...props} rows={2} />}
                                            </label>
                                        );
                                    })}
                                    {seccion.repetible && campos[seccion.id].length > 1 && (
                                        <button type="button" className="justify-self-start text-sm font-semibold text-red-800 underline"
                                            onClick={() => setCampos((p) => ({ ...p, [seccion.id]: p[seccion.id].filter((_, i) => i !== filaIndice) }))}>
                                            Quitar registro {filaIndice + 1}
                                        </button>
                                    )}
                                </div>
                            ))}
                            {seccion.repetible && campos[seccion.id].length < 20 && (
                                <button type="button" className={secundaria}
                                    onClick={() => setCampos((p) => ({ ...p, [seccion.id]: [...p[seccion.id], filaVacia(seccion)] }))}>
                                    Agregar registro
                                </button>
                            )}
                        </fieldset>
                    ))}
                </>
            )}
            {error && <p role="alert" className={guia}>{error}</p>}
            <button type="submit" disabled={guardando || modo === "formato" && secciones.length === 0} className={accion}>
                {guardando ? "Preparando PDF…" : "Registrar y enviar a la bandeja de firma"}
            </button>
        </form>
    );
}
