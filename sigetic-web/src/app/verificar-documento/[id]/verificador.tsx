"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileCheck2 } from "lucide-react";

type Constancia = { tipo: string; huellaSha256: string; fechaFirmaUtc: string };
type Cotejo = { mensaje: string; coincide: boolean };

const fechaColombia = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/Bogota",
});

export default function Verificador({ id }: { id: string }) {
    const [registro, setRegistro] = useState<Constancia | null>(null);
    const [estado, setEstado] = useState<"consulta" | "no-disponible" | "error" | "listo">("consulta");
    const [cotejo, setCotejo] = useState<Cotejo | null>(null);
    const [ocupado, setOcupado] = useState(false);

    useEffect(() => {
        const abortar = new AbortController();
        const buscar = async () => {
            if (!/^[a-f\d]{32}$/i.test(id)) {
                setEstado("no-disponible");
                return;
            }
            try {
                const respuesta = await fetch(`/api/documentos-firma/verificar/${id}`, {
                    cache: "no-store", signal: abortar.signal,
                });
                if (respuesta.status === 404) {
                    setEstado("no-disponible");
                    return;
                }
                if (!respuesta.ok) throw new Error("No se pudo consultar la constancia.");
                const datos = await respuesta.json() as Constancia;
                setRegistro(datos);
                setEstado("listo");
            } catch {
                if (!abortar.signal.aborted) setEstado("error");
            }
        };
        void buscar();
        return () => abortar.abort();
    }, [id]);

    async function cotejar(archivo: File) {
        if (!registro) return;
        setOcupado(true);
        setCotejo(null);
        try {
            if (!crypto.subtle) throw new Error("Abre SIGETIC por HTTPS para cotejar el PDF.");
            if (archivo.size > 24 * 1024 * 1024) throw new Error("Selecciona un PDF de hasta 24 MB.");
            const digest = await crypto.subtle.digest("SHA-256", await archivo.arrayBuffer());
            const huella = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
            const coincide = huella === registro.huellaSha256;
            setCotejo({
                coincide,
                mensaje: coincide
                    ? "El archivo coincide con el PDF firmado y archivado en SIGETIC."
                    : "La huella del archivo difiere de la huella del PDF firmado que guarda SIGETIC.",
            });
        } catch (error) {
            setCotejo({ coincide: false, mensaje: error instanceof Error ? error.message : "No se pudo leer el archivo." });
        } finally {
            setOcupado(false);
        }
    }

    if (estado !== "listo" || !registro) {
        return <p role="status" className="p-6 text-slate-700">
            {estado === "consulta" ? "Consultando el registro de firma…" : estado === "error"
                ? "SIGETIC no pudo consultar el registro. Intenta de nuevo en unos minutos."
                : "No hay una constancia de firma disponible para este identificador."}
        </p>;
    }

    return (
        <div className="space-y-6 p-5 sm:p-7">
            <section>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#006b2e]">
                    <CheckCircle2 aria-hidden="true" className="h-5 w-5" /> Firma registrada en SIGETIC
                </h2>
                <dl className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div><dt className="font-semibold">Tipo</dt><dd>{registro.tipo}</dd></div>
                    <div><dt className="font-semibold">Identificador</dt><dd className="break-all font-mono">{id}</dd></div>
                    <div><dt className="font-semibold">Firmas completadas</dt><dd>{fechaColombia.format(new Date(registro.fechaFirmaUtc))}</dd></div>
                    <div><dt className="font-semibold">Huella SHA-256 del PDF firmado</dt><dd className="break-all font-mono">{registro.huellaSha256}</dd></div>
                </dl>
            </section>
            <section>
                <h2 className="flex items-center gap-2 font-bold"><FileCheck2 aria-hidden="true" className="h-5 w-5" /> Cotejar tu PDF</h2>
                <p className="my-2 text-sm text-slate-700">Selecciona el archivo que recibiste para compararlo con el registrado. La comparación se hace en tu dispositivo.</p>
                <label className="block text-sm font-semibold">
                    PDF firmado
                    <input type="file" accept=".pdf,application/pdf" disabled={ocupado}
                        className="mt-1 block w-full rounded-xl border border-slate-300 p-2 text-sm"
                        onChange={(e) => {
                            const archivo = e.target.files?.[0];
                            e.target.value = "";
                            if (archivo) void cotejar(archivo);
                        }} />
                </label>
                {ocupado && <p role="status" className="mt-3 text-sm">Calculando la huella…</p>}
                {cotejo && <p role="status" className={`mt-3 rounded-xl p-3 text-sm font-semibold ${cotejo.coincide ? "bg-green-50 text-green-900" : "bg-amber-50 text-amber-950"}`}>{cotejo.mensaje}</p>}
            </section>
        </div>
    );
}
