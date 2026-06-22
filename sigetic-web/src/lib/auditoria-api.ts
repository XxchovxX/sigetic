import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type AuditoriaRegistro = {
    id: string;
    modulo: string;
    accion: string;
    entidad: string;
    registroId?: string | null;
    usuario: string;
    rol?: string | null;
    metodoHttp?: string | null;
    ruta?: string | null;
    direccionIp?: string | null;
    resumen?: string | null;
    fechaEventoUtc: string;
};

export type AuditoriaFiltros = {
    modulo?: string;
    accion?: string;
    usuario?: string;
    take?: number;
};

export async function getAuditoria(
    filtros: AuditoriaFiltros = {}
): Promise<AuditoriaRegistro[]> {
    const token = getToken();
    const params = new URLSearchParams();

    if (filtros.modulo) params.set("modulo", filtros.modulo);
    if (filtros.accion) params.set("accion", filtros.accion);
    if (filtros.usuario) params.set("usuario", filtros.usuario);
    if (filtros.take) params.set("take", String(filtros.take));

    const query = params.toString();
    const response = await fetch(
        `${getApiUrl()}/api/auditoria${query ? `?${query}` : ""}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        if (response.status === 403) {
            throw new Error("No tienes permisos para consultar la auditoría.");
        }

        throw new Error("No fue posible cargar la auditoría del sistema.");
    }

    return response.json() as Promise<AuditoriaRegistro[]>;
}
