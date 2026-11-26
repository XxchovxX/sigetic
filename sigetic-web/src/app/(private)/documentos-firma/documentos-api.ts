import { getToken } from "@/lib/auth";

export type Campo = {
    etiqueta: string;
    guia: string;
    tipo: string;
    opciones?: string[];
    requerido: boolean;
};

export type Seccion = {
    id: string;
    titulo: string;
    guia: string;
    campos: Campo[];
    repetible: boolean;
    ejemplos?: string[][];
};

export type Documento = {
    id: string;
    titulo: string;
    tipo: string;
    creadoUtc: string;
    sha256: string;
    sha256Final?: string;
    canceladoUtc?: string;
    acuerdo: string;
    puedeFirmar: boolean;
    puedeCancelar: boolean;
    firmantes: Array<{ nombre: string; cargo?: string; rol: string; fechaUtc?: string }>;
};

async function solicitar(ruta: string, body?: object, method = body ? "POST" : "GET") {
    const token = getToken();
    if (!token) throw new Error("Inicia sesión para continuar.");
    const response = await fetch(`/api/documentos-firma${ruta}`, {
        headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
        method,
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        const fallback = response.status === 429
            ? "Se alcanzó el límite de solicitudes. Espera unos minutos antes de volver a intentar."
            : "SIGETIC no pudo completar la solicitud.";
        throw new Error(error?.message ?? fallback);
    }
    return response;
}

export async function api<T>(ruta = "", body?: object): Promise<T> {
    return (await solicitar(ruta, body)).json() as Promise<T>;
}

export async function obtenerPdf(id: string, final: boolean) {
    return (await solicitar(`/${id}/pdf?final=${final}`)).blob();
}

export async function eliminarDocumento(id: string) {
    await solicitar(`/${id}`, undefined, "DELETE");
}

export const fechaColombia = new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota",
});
