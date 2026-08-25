import { getApiUrl } from "@/lib/api-url";
import { getToken } from "@/lib/auth";

export type FormacionMaterial = {
    id: string;
    titulo: string;
    tipo: string;
    url: string;
    orden: number;
};

export type FormacionOpcion = {
    id: string;
    texto: string;
    orden: number;
};

export type FormacionPregunta = {
    id: string;
    texto: string;
    explicacion?: string | null;
    orden: number;
    opciones: FormacionOpcion[];
};

export type FormacionCurso = {
    id: string;
    titulo: string;
    descripcion: string;
    categoria: string;
    dirigidoA: string;
    duracionMinutos: number;
    puntajeMinimo: number;
    activo: boolean;
    fechaCreacionUtc: string;
    fechaActualizacionUtc?: string | null;
    materiales: FormacionMaterial[];
    preguntas: FormacionPregunta[];
    ultimoIntento?: FormacionIntento | null;
};

export type FormacionIntento = {
    id: string;
    cursoId: string;
    cursoTitulo: string;
    participanteNombre: string;
    participanteCorreo: string;
    totalPreguntas: number;
    respuestasCorrectas: number;
    puntaje: number;
    aprobado: boolean;
    codigoCertificado?: string | null;
    fechaPresentacionUtc: string;
};

export type FormacionCertificado = {
    intentoId: string;
    cursoId: string;
    cursoTitulo: string;
    participanteNombre: string;
    participanteCorreo: string;
    categoria: string;
    dirigidoA: string;
    duracionMinutos: number;
    puntaje: number;
    puntajeMinimo: number;
    codigoCertificado: string;
    fechaPresentacionUtc: string;
};

export type CrearCursoFormacionPayload = {
    titulo: string;
    descripcion: string;
    categoria: string;
    dirigidoA: string;
    duracionMinutos: number;
    puntajeMinimo: number;
    activo: boolean;
    materiales: Array<{
        titulo: string;
        tipo: string;
        url: string;
        orden: number;
    }>;
    preguntas: Array<{
        texto: string;
        explicacion?: string | null;
        orden: number;
        opciones: Array<{
            texto: string;
            esCorrecta: boolean;
            orden: number;
        }>;
    }>;
};

export type ResponderEvaluacionFormacionPayload = {
    respuestas: Array<{
        preguntaId: string;
        opcionId: string;
    }>;
};

export type ResultadoFormacion = {
    intentoId: string;
    cursoId: string;
    cursoTitulo: string;
    puntaje: number;
    puntajeMinimo: number;
    totalPreguntas: number;
    respuestasCorrectas: number;
    aprobado: boolean;
    codigoCertificado?: string | null;
    fechaPresentacionUtc: string;
    detalle: Array<{
        preguntaId: string;
        pregunta: string;
        opcionSeleccionadaId: string;
        opcionSeleccionada: string;
        correcta: boolean;
        explicacion?: string | null;
    }>;
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

export async function getCursosFormacion(): Promise<FormacionCurso[]> {
    return apiFetch<FormacionCurso[]>("/api/formacion/cursos");
}

export async function getCursoFormacion(id: string): Promise<FormacionCurso> {
    return apiFetch<FormacionCurso>(`/api/formacion/cursos/${id}`);
}

export async function createCursoFormacion(
    payload: CrearCursoFormacionPayload
): Promise<FormacionCurso> {
    return apiFetch<FormacionCurso>("/api/formacion/cursos", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateCursoFormacion(
    id: string,
    payload: CrearCursoFormacionPayload
): Promise<FormacionCurso> {
    return apiFetch<FormacionCurso>(`/api/formacion/cursos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function responderEvaluacionFormacion(
    id: string,
    payload: ResponderEvaluacionFormacionPayload
): Promise<ResultadoFormacion> {
    return apiFetch<ResultadoFormacion>(`/api/formacion/cursos/${id}/evaluacion`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getMisIntentosFormacion(): Promise<FormacionIntento[]> {
    return apiFetch<FormacionIntento[]>("/api/formacion/mis-intentos");
}

export async function getCertificadoFormacion(
    intentoId: string
): Promise<FormacionCertificado> {
    return apiFetch<FormacionCertificado>(
        `/api/formacion/certificados/${intentoId}`
    );
}
