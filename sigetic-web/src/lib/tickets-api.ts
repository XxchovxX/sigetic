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
    eliminado: boolean;
    fechaEliminacionUtc?: string | null;
    eliminadoPor?: string | null;
    historial: TicketHistorial[];
};

export type TicketHistorial = {
    id: string;
    tipoEvento: string;
    usuario: string;
    estadoAnterior?: string | null;
    estadoNuevo?: string | null;
    detalle?: string | null;
    fechaEventoUtc: string;
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
        const message = await getErrorMessage(response);

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response): Promise<string> {
    if (response.status === 401) {
        return "No autorizado. Inicia sesión nuevamente.";
    }

    if (response.status === 403) {
        return "No tienes permisos para realizar esta acción.";
    }

    try {
        const error = await response.clone().json();

        if (typeof error?.message === "string" && error.message.trim()) {
            return error.message;
        }
    } catch {
        const text = await response.text();

        if (text.trim()) {
            return text;
        }
    }

    return "No fue posible completar la solicitud de mesa de ayuda.";
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

export async function deleteTicket(id: string): Promise<void> {
    await apiFetch<void>(`/api/tickets/${id}`, {
        method: "DELETE",
    });
}
