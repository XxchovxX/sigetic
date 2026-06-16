import { getApiUrl } from "@/lib/api-url";

export type Equipo = {
    id: string;
    codigoInterno: string;
    tipoEquipo: string;
    marca: string;
    modelo: string;
    serial: string;
    dependencia: string;
    funcionarioAsignado: string;
    estado: string;
    procesador: string;
    memoriaRam: string;
    almacenamiento: string;
    sistemaOperativo: string;
    direccionIp?: string | null;
    direccionMac?: string | null;
    ubicacionFisica: string;
    fechaIngreso: string;
    observaciones?: string | null;
    fechaCreacionUtc: string;
};

export type CrearEquipoPayload = Omit<Equipo, "id" | "fechaCreacionUtc">;

export type ActualizarEquipoPayload = CrearEquipoPayload;

export type MantenimientoEquipo = {
    id: string;
    equipoId: string;
    tipoMantenimiento: string;
    fechaMantenimiento: string;
    tecnicoResponsable: string;
    diagnostico: string;
    actividadesRealizadas: string;
    repuestosUtilizados?: string | null;
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

export type CrearMantenimientoEquipoPayload = {
    tipoMantenimiento: string;
    fechaMantenimiento: string;
    tecnicoResponsable: string;
    diagnostico: string;
    actividadesRealizadas: string;
    repuestosUtilizados?: string | null;
    estadoResultante: string;
    proximaRevision?: string | null;
    observaciones?: string | null;
    firmaTecnico?: string | null;
    firmaRecibe?: string | null;
    nombreRecibe?: string | null;
    documentoRecibe?: string | null;
};

export type BajaEquipo = {
    id: string;
    equipoId: string;
    fechaBaja: string;
    motivoBaja: string;
    responsableBaja: string;
    estadoFisico: string;
    disposicionFinal: string;
    observaciones?: string | null;
    fechaCreacionUtc: string;
};

export type CrearBajaEquipoPayload = {
    fechaBaja: string;
    motivoBaja: string;
    responsableBaja: string;
    estadoFisico: string;
    disposicionFinal: string;
    observaciones?: string | null;
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = "Ocurrió un error al comunicarse con SIGETIC API.";

        try {
            const error = await response.json();

            if (error?.message) {
                message = error.message;
            }
        } catch {
            // Se conserva el mensaje genérico.
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function getEquipos(): Promise<Equipo[]> {
    const response = await fetch(`${getApiUrl()}/api/equipos`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    return handleResponse<Equipo[]>(response);
}

export async function getEquipoById(id: string): Promise<Equipo> {
    const response = await fetch(`${getApiUrl()}/api/equipos/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    return handleResponse<Equipo>(response);
}

export async function createEquipo(
    payload: CrearEquipoPayload
): Promise<Equipo> {
    const response = await fetch(`${getApiUrl()}/api/equipos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse<Equipo>(response);
}

export async function updateEquipo(
    id: string,
    payload: ActualizarEquipoPayload
): Promise<Equipo> {
    const response = await fetch(`${getApiUrl()}/api/equipos/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse<Equipo>(response);
}

export async function getMantenimientosByEquipoId(
    equipoId: string
): Promise<MantenimientoEquipo[]> {
    const response = await fetch(
        `${getApiUrl()}/api/equipos/${equipoId}/mantenimientos`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        }
    );

    return handleResponse<MantenimientoEquipo[]>(response);
}

export async function createMantenimientoEquipo(
    equipoId: string,
    payload: CrearMantenimientoEquipoPayload
): Promise<MantenimientoEquipo> {
    const response = await fetch(
        `${getApiUrl()}/api/equipos/${equipoId}/mantenimientos`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );

    return handleResponse<MantenimientoEquipo>(response);
}

export async function getBajaEquipoByEquipoId(
    equipoId: string
): Promise<BajaEquipo | null> {
    const response = await fetch(`${getApiUrl()}/api/equipos/${equipoId}/baja`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        cache: "no-store",
    });

    if (response.status === 404) {
        return null;
    }

    return handleResponse<BajaEquipo>(response);
}

export async function createBajaEquipo(
    equipoId: string,
    payload: CrearBajaEquipoPayload
): Promise<BajaEquipo> {
    const response = await fetch(`${getApiUrl()}/api/equipos/${equipoId}/baja`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse<BajaEquipo>(response);
}
