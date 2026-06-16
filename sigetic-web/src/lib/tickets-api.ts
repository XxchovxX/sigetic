import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type TicketMesaAyuda = {
    id: string;
    codigo: string;
    fechaSolicitud: string;
    solicitante: string;
    dependencia: string;
    categoria: string;
    prioridad: string;
    estado: string;
    descripcion: string;
    responsableAsignado?: string | null;
    equipoCodigo?: string | null;
    impresoraCodigo?: string | null;
    fechaCompromiso?: string | null;
    solucion?: string | null;
    calificacionTiempo?: number | null;
    calificacionAtencion?: number | null;
    calificacionAmabilidad?: number | null;
    calificacionSolucion?: number | null;
    comentarioSatisfaccion?: string | null;
    fechaEncuestaUtc?: string | null;
    fechaCreacionUtc: string;
    fechaActualizacionUtc?: string | null;
};

export type CrearTicketPayload = {
    fechaSolicitud: string;
    solicitante: string;
    dependencia: string;
    categoria: string;
    prioridad: string;
    estado: string;
    descripcion: string;
    responsableAsignado?: string | null;
    equipoCodigo?: string | null;
    impresoraCodigo?: string | null;
    fechaCompromiso?: string | null;
    solucion?: string | null;
};

export type RegistrarEncuestaTicketPayload = {
    calificacionTiempo: number;
    calificacionAtencion: number;
    calificacionAmabilidad: number;
    calificacionSolucion: number;
    comentarioSatisfaccion?: string | null;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();

    const response = await fetch(`${getApiUrl()}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
        cache: "no-store",
    });

    if (!response.ok) {
        let message = "No fue posible completar la solicitud de mesa de ayuda.";

        try {
            const error = await response.json();

            if (error?.message) {
                message = error.message;
            }
        } catch {
            if (response.status === 401) {
                message = "No autorizado. Inicia sesión nuevamente.";
            }
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function getTickets(): Promise<TicketMesaAyuda[]> {
    return apiFetch<TicketMesaAyuda[]>("/api/tickets");
}

export async function getTicket(id: string): Promise<TicketMesaAyuda> {
    return apiFetch<TicketMesaAyuda>(`/api/tickets/${id}`);
}

export async function createTicket(
    payload: CrearTicketPayload
): Promise<TicketMesaAyuda> {
    return apiFetch<TicketMesaAyuda>("/api/tickets", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateTicketEstado(
    id: string,
    payload: Pick<TicketMesaAyuda, "estado"> & {
        responsableAsignado?: string | null;
        solucion?: string | null;
    }
): Promise<TicketMesaAyuda> {
    return apiFetch<TicketMesaAyuda>(`/api/tickets/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function registrarEncuestaTicket(
    id: string,
    payload: RegistrarEncuestaTicketPayload
): Promise<TicketMesaAyuda> {
    return apiFetch<TicketMesaAyuda>(`/api/tickets/${id}/encuesta`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}
