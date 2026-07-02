import { getApiUrl } from "@/lib/api-url";
import { getToken } from "@/lib/auth";

export type ProgramacionMantenimiento = {
    id: string;
    tipoActivo: "Equipo" | "Impresora";
    equipoId?: string | null;
    impresoraId?: string | null;
    codigoActivo: string;
    nombreActivo: string;
    tipoMantenimiento: string;
    fechaProgramada: string;
    horaProgramada?: string | null;
    frecuencia: string;
    estado: "Programado" | "Notificado" | "Ejecutado" | "Vencido" | "Cancelado";
    tecnicoResponsable: string;
    correoTecnico?: string | null;
    observaciones?: string | null;
    ultimaNotificacionUtc?: string | null;
    fechaCreacionUtc: string;
    fechaActualizacionUtc?: string | null;
};

export type CrearProgramacionMantenimientoPayload = {
    tipoActivo: "Equipo" | "Impresora";
    equipoId?: string | null;
    impresoraId?: string | null;
    tipoMantenimiento: string;
    fechaProgramada: string;
    horaProgramada?: string | null;
    frecuencia: string;
    tecnicoResponsable: string;
    correoTecnico?: string | null;
    observaciones?: string | null;
};

export type ActualizarProgramacionMantenimientoPayload = {
    fechaProgramada: string;
    horaProgramada?: string | null;
    frecuencia: string;
    tecnicoResponsable: string;
    correoTecnico?: string | null;
    observaciones?: string | null;
};

export type RecordatoriosMantenimientoResponse = {
    totalNotificados: number;
    programaciones: ProgramacionMantenimiento[];
};

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
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
        let message = "No fue posible completar la solicitud.";

        try {
            const error = await response.json();

            if (error?.message) {
                message = error.message;
            }
        } catch {
            if (response.status === 401) {
                message = "No autorizado. Inicia sesion nuevamente.";
            }
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export async function getProgramacionesMantenimiento(params?: {
    desde?: string;
    hasta?: string;
    estado?: string;
    tipoActivo?: string;
}): Promise<ProgramacionMantenimiento[]> {
    const search = new URLSearchParams();

    if (params?.desde) search.set("desde", params.desde);
    if (params?.hasta) search.set("hasta", params.hasta);
    if (params?.estado && params.estado !== "Todos") search.set("estado", params.estado);
    if (params?.tipoActivo && params.tipoActivo !== "Todos") search.set("tipoActivo", params.tipoActivo);

    const query = search.toString();

    return apiFetch<ProgramacionMantenimiento[]>(
        `/api/programacion-mantenimientos${query ? `?${query}` : ""}`
    );
}

export async function createProgramacionMantenimiento(
    payload: CrearProgramacionMantenimientoPayload
): Promise<ProgramacionMantenimiento> {
    return apiFetch<ProgramacionMantenimiento>("/api/programacion-mantenimientos", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateProgramacionMantenimiento(
    id: string,
    payload: ActualizarProgramacionMantenimientoPayload
): Promise<ProgramacionMantenimiento> {
    return apiFetch<ProgramacionMantenimiento>(`/api/programacion-mantenimientos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function marcarProgramacionEjecutada(
    id: string
): Promise<ProgramacionMantenimiento> {
    return apiFetch<ProgramacionMantenimiento>(
        `/api/programacion-mantenimientos/${id}/ejecutar`,
        {
            method: "POST",
            body: JSON.stringify({}),
        }
    );
}

export async function cancelarProgramacionMantenimiento(id: string): Promise<void> {
    await apiFetch<void>(`/api/programacion-mantenimientos/${id}/cancelar`, {
        method: "POST",
        body: JSON.stringify({}),
    });
}

export async function enviarRecordatoriosMantenimiento(
    diasAnticipacion = 3
): Promise<RecordatoriosMantenimientoResponse> {
    return apiFetch<RecordatoriosMantenimientoResponse>(
        "/api/programacion-mantenimientos/recordatorios",
        {
            method: "POST",
            body: JSON.stringify({ diasAnticipacion }),
        }
    );
}
