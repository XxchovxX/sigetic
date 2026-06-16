import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type Impresora = {
    id: string;
    codigoInterno: string;
    marca: string;
    modelo: string;
    serial: string;
    tipoImpresora: string;
    tecnologiaImpresion: string;
    dependenciaId: string;
    dependencia: string;
    funcionarioAsignadoId?: string | null;
    funcionarioAsignado?: string | null;
    estado: string;
    ubicacionFisica: string;
    direccionIp?: string | null;
    direccionMac?: string | null;
    fechaIngreso: string;
    observaciones?: string | null;
    fechaCreacionUtc: string;
};

export type CrearImpresoraPayload = {
    codigoInterno: string;
    marca: string;
    modelo: string;
    serial: string;
    tipoImpresora: string;
    tecnologiaImpresion: string;
    dependenciaId: string;
    funcionarioAsignadoId?: string | null;
    estado: string;
    ubicacionFisica: string;
    direccionIp?: string | null;
    direccionMac?: string | null;
    fechaIngreso: string;
    observaciones?: string | null;
};

export type MantenimientoImpresora = {
    id: string;
    impresoraId: string;
    tipoMantenimiento: string;
    fechaMantenimiento: string;
    tecnicoResponsable: string;
    diagnostico: string;
    actividadesRealizadas: string;
    repuestosUtilizados?: string | null;
    contadorPaginas?: number | null;
    estadoResultante: string;
    proximaRevision?: string | null;
    observaciones?: string | null;
    firmaTecnico?: string | null;
    firmaRecibe?: string | null;
    nombreRecibe?: string | null;
    documentoRecibe?: string | null;
    fechaFirmaUtc?: string | null;
    fechaCreacionUtc: string;
};

export type CrearMantenimientoImpresoraPayload = {
    tipoMantenimiento: string;
    fechaMantenimiento: string;
    tecnicoResponsable: string;
    diagnostico: string;
    actividadesRealizadas: string;
    repuestosUtilizados?: string | null;
    contadorPaginas?: number | null;
    estadoResultante: string;
    proximaRevision?: string | null;
    observaciones?: string | null;
    firmaTecnico?: string | null;
    firmaRecibe?: string | null;
    nombreRecibe?: string | null;
    documentoRecibe?: string | null;
};

export type HistorialConsumibleImpresora = {
    id: string;
    impresoraId: string;
    fechaMovimiento: string;
    tipoMovimiento: string;
    tipoConsumible: string;
    referencia: string;
    color: string;
    cantidad: number;
    responsableEntrega: string;
    contadorPaginas?: number | null;
    observaciones?: string | null;
    fechaCreacionUtc: string;
};

export type CrearHistorialConsumibleImpresoraPayload = {
    fechaMovimiento: string;
    tipoMovimiento: string;
    tipoConsumible: string;
    referencia: string;
    color: string;
    cantidad: number;
    responsableEntrega: string;
    contadorPaginas?: number | null;
    observaciones?: string | null;
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
                message = "No autorizado. Inicia sesión nuevamente.";
            }
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function getImpresoras(): Promise<Impresora[]> {
    return apiFetch<Impresora[]>("/api/impresoras");
}

export async function getImpresora(id: string): Promise<Impresora> {
    return apiFetch<Impresora>(`/api/impresoras/${id}`);
}

export async function createImpresora(
    payload: CrearImpresoraPayload
): Promise<Impresora> {
    return apiFetch<Impresora>("/api/impresoras", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateImpresora(
    id: string,
    payload: CrearImpresoraPayload
): Promise<Impresora> {
    return apiFetch<Impresora>(`/api/impresoras/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function getMantenimientosImpresora(
    impresoraId: string
): Promise<MantenimientoImpresora[]> {
    return apiFetch<MantenimientoImpresora[]>(
        `/api/impresoras/${impresoraId}/mantenimientos`
    );
}

export async function createMantenimientoImpresora(
    impresoraId: string,
    payload: CrearMantenimientoImpresoraPayload
): Promise<MantenimientoImpresora> {
    return apiFetch<MantenimientoImpresora>(
        `/api/impresoras/${impresoraId}/mantenimientos`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}

export async function getHistorialConsumiblesImpresora(
    impresoraId: string
): Promise<HistorialConsumibleImpresora[]> {
    return apiFetch<HistorialConsumibleImpresora[]>(
        `/api/impresoras/${impresoraId}/consumibles`
    );
}

export async function createHistorialConsumibleImpresora(
    impresoraId: string,
    payload: CrearHistorialConsumibleImpresoraPayload
): Promise<HistorialConsumibleImpresora> {
    return apiFetch<HistorialConsumibleImpresora>(
        `/api/impresoras/${impresoraId}/consumibles`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}
