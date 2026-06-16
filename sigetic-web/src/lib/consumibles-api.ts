import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type Consumible = {
    id: string;
    codigoInterno: string;
    nombre: string;
    tipoConsumible: string;
    referencia: string;
    color: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    costoUnitario: number;
    bajoStock: boolean;
    marcaCompatible?: string | null;
    modelosCompatibles?: string | null;
    observaciones?: string | null;
    activo: boolean;
    fechaCreacionUtc: string;
    fechaActualizacionUtc?: string | null;
};

export type CrearConsumiblePayload = {
    codigoInterno: string;
    nombre: string;
    tipoConsumible: string;
    referencia: string;
    color: string;
    unidadMedida: string;
    stockActual: number;
    stockMinimo: number;
    costoUnitario: number;
    marcaCompatible?: string | null;
    modelosCompatibles?: string | null;
    observaciones?: string | null;
};

export type ActualizarConsumiblePayload = Omit<
    CrearConsumiblePayload,
    "stockActual"
> & {
    activo: boolean;
};

export type MovimientoConsumible = {
    id: string;
    consumibleId: string;
    fechaMovimiento: string;
    tipoMovimiento: string;
    cantidad: number;
    responsable: string;
    destino?: string | null;
    dependenciaId?: string | null;
    dependencia?: string | null;
    impresoraId?: string | null;
    impresora?: string | null;
    documentoSoporte?: string | null;
    observaciones?: string | null;
    stockResultante: number;
    costoUnitario: number;
    costoTotal: number;
    fechaCreacionUtc: string;
};

export type CrearMovimientoConsumiblePayload = {
    fechaMovimiento: string;
    tipoMovimiento: string;
    cantidad: number;
    responsable: string;
    destino?: string | null;
    dependenciaId?: string | null;
    impresoraId?: string | null;
    documentoSoporte?: string | null;
    observaciones?: string | null;
    costoUnitario?: number | null;
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

export async function getConsumibles(): Promise<Consumible[]> {
    return apiFetch<Consumible[]>("/api/consumibles");
}

export async function getConsumiblesBajoStock(): Promise<Consumible[]> {
    return apiFetch<Consumible[]>("/api/consumibles/bajo-stock");
}

export async function getConsumible(id: string): Promise<Consumible> {
    return apiFetch<Consumible>(`/api/consumibles/${id}`);
}

export async function createConsumible(
    payload: CrearConsumiblePayload
): Promise<Consumible> {
    return apiFetch<Consumible>("/api/consumibles", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateConsumible(
    id: string,
    payload: ActualizarConsumiblePayload
): Promise<Consumible> {
    return apiFetch<Consumible>(`/api/consumibles/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function getMovimientosConsumible(
    consumibleId: string
): Promise<MovimientoConsumible[]> {
    return apiFetch<MovimientoConsumible[]>(
        `/api/consumibles/${consumibleId}/movimientos`
    );
}

export async function createMovimientoConsumible(
    consumibleId: string,
    payload: CrearMovimientoConsumiblePayload
): Promise<MovimientoConsumible> {
    return apiFetch<MovimientoConsumible>(
        `/api/consumibles/${consumibleId}/movimientos`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    );
}
