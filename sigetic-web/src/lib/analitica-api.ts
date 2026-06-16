import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type ConsumoDependencia = {
    dependencia: string;
    tickets: number;
    mantenimientos: number;
    consumibles: number;
    costoConsumibles: number;
};

export type PresupuestoConsumible = {
    periodo: string;
    tipoConsumible: string;
    unidadesEjecutadas: number;
    costoEjecutado: number;
};

export type AlertaStock = {
    consumibleId: string;
    codigoInterno: string;
    nombre: string;
    tipoConsumible: string;
    referencia: string;
    color: string;
    stockActual: number;
    stockMinimo: number;
    unidadesSugeridas: number;
};

export type CalendarioMantenimiento = {
    tipoActivo: string;
    codigo: string;
    nombre: string;
    dependencia: string;
    fecha: string;
    tipoMantenimiento: string;
    estado: string;
};

export type SemaforoActivo = {
    tipoActivo: string;
    codigo: string;
    nombre: string;
    dependencia: string;
    estado: string;
    color: string;
    motivo: string;
};

export type SatisfaccionTickets = {
    encuestas: number;
    promedioTiempo: number;
    promedioAtencion: number;
    promedioAmabilidad: number;
    promedioSolucion: number;
    promedioGeneral: number;
};

export type HistorialConsolidadoItem = {
    fecha: string;
    tipo: string;
    titulo: string;
    detalle: string;
    responsable: string;
};

export type HistorialConsolidado = {
    codigo: string;
    nombre: string;
    tipoActivo: string;
    dependencia?: string | null;
    eventos: HistorialConsolidadoItem[];
};

export type AnaliticaResumen = {
    consumoPorDependencia: ConsumoDependencia[];
    presupuestoConsumibles: PresupuestoConsumible[];
    alertasStock: AlertaStock[];
    calendario: CalendarioMantenimiento[];
    semaforoActivos: SemaforoActivo[];
    satisfaccionTickets: SatisfaccionTickets;
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
        let message = "No fue posible cargar la analitica.";

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

export async function getAnaliticaResumen(): Promise<AnaliticaResumen> {
    return apiFetch<AnaliticaResumen>("/api/analitica");
}

export async function getHistorialConsolidado(
    codigo: string
): Promise<HistorialConsolidado> {
    return apiFetch<HistorialConsolidado>(
        `/api/analitica/historial/${encodeURIComponent(codigo)}`
    );
}
