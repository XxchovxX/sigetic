import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type DashboardActividad = {
    fecha: string;
    titulo: string;
    detalle: string;
    estado: string;
};

export type DashboardResumen = {
    totalEquipos: number;
    equiposActivos: number;
    equiposEnMantenimiento: number;
    totalImpresoras: number;
    impresorasActivas: number;
    consumiblesBajoStock: number;
    ticketsAbiertos: number;
    ticketsEnProceso: number;
    ultimosMovimientosConsumibles: DashboardActividad[];
    ultimosMantenimientos: DashboardActividad[];
    ultimosTickets: DashboardActividad[];
};

export async function getDashboardResumen(): Promise<DashboardResumen> {
    const token = getToken();

    const response = await fetch(`${getApiUrl()}/api/dashboard/resumen`, {
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("No fue posible cargar el resumen del dashboard.");
    }

    return response.json() as Promise<DashboardResumen>;
}
