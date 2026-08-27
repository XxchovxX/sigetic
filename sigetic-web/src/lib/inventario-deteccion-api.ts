import { getApiUrl } from "@/lib/api-url";
import { getToken } from "@/lib/auth";

export type DiscoInventarioDetectado = {
    modelo?: string | null;
    capacidadBytes: number;
    tipo?: string | null;
};

export type DatosInventarioDetectados = {
    nombreEquipo?: string | null;
    fabricante?: string | null;
    modelo?: string | null;
    serial?: string | null;
    uuidHardware?: string | null;
    tipoEquipo?: string | null;
    procesador?: string | null;
    memoriaRamGb: number;
    discos?: DiscoInventarioDetectado[] | null;
    sistemaOperativo?: string | null;
    versionSistemaOperativo?: string | null;
    arquitectura?: string | null;
    direccionIp?: string | null;
    direccionMac?: string | null;
    usuarioActual?: string | null;
    biosVersion?: string | null;
    fechaInstalacion?: string | null;
};

export type InventarioDeteccionCreada = {
    id: string;
    token: string;
    expiraUtc: string;
};

export type EstadoInventarioDeteccion = {
    id: string;
    estado: "Pendiente" | "Recibida" | "Expirada";
    expiraUtc: string;
    fechaRecepcionUtc?: string | null;
    datos?: DatosInventarioDetectados | null;
    equipoExistenteId?: string | null;
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = "No fue posible completar la deteccion automatica.";

        try {
            const body = await response.json();
            if (body?.message) message = body.message;
        } catch {
            // Se conserva el mensaje generico.
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

function authorizedHeaders(): HeadersInit {
    const token = getToken();

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function crearInventarioDeteccion(): Promise<InventarioDeteccionCreada> {
    const response = await fetch(`${getApiUrl()}/api/equipos/detecciones`, {
        method: "POST",
        headers: authorizedHeaders(),
    });

    return handleResponse<InventarioDeteccionCreada>(response);
}

export async function getEstadoInventarioDeteccion(
    id: string
): Promise<EstadoInventarioDeteccion> {
    const response = await fetch(`${getApiUrl()}/api/equipos/detecciones/${id}`, {
        method: "GET",
        headers: authorizedHeaders(),
        cache: "no-store",
    });

    return handleResponse<EstadoInventarioDeteccion>(response);
}

export async function descargarRecolectorWindows(
    token: string,
    publicOrigin: string,
    detectionId: string
) {
    const response = await fetch("/recolector/SIGETIC-Detectar-Equipo.ps1", {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error("No fue posible preparar el recolector de Windows.");
    }

    const endpoint = `${publicOrigin.replace(/\/$/, "")}/api/equipos/detecciones/reportar`;
    const template = await response.text();
    const script = template
        .replace("__SIGETIC_ENDPOINT__", endpoint.replaceAll("'", "''"))
        .replace("__SIGETIC_TOKEN__", token);
    const blob = new Blob(["\uFEFF", script], {
        type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `SIGETIC-Equipo-${detectionId.slice(0, 8)}.ps1`;

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    return fileName;
}
