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
    textoRelacionado?: string | null;
    orden: number;
};

export type FormacionPregunta = {
    id: string;
    texto: string;
    tipo: TipoPreguntaFormacion;
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
    entidadCertificadora: string;
    duracionMinutos: number;
    puntajeMinimo: number;
    activo: boolean;
    fechaCreacionUtc: string;
    fechaActualizacionUtc?: string | null;
    dependenciasDestino: FormacionDependenciaDestino[];
    usuariosDestino: FormacionUsuarioDestino[];
    materiales: FormacionMaterial[];
    preguntas: FormacionPregunta[];
    ultimoIntento?: FormacionIntento | null;
};

export type FormacionDependenciaDestino = { id: string; nombre: string };

export type FormacionUsuarioDestino = {
    id: string;
    nombreCompleto: string;
    correo: string;
    dependenciaId?: string | null;
    dependencia?: string | null;
};

export type FormacionDestinatarios = {
    dependencias: FormacionDependenciaDestino[];
    usuarios: FormacionUsuarioDestino[];
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
    entidadCertificadora: string;
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
    entidadCertificadora: string;
    duracionMinutos: number;
    puntajeMinimo: number;
    activo: boolean;
    dependenciaIds: string[];
    usuarioIds: string[];
    materiales: Array<{
        titulo: string;
        tipo: string;
        url: string;
        orden: number;
    }>;
    preguntas: Array<{
        texto: string;
        tipo: TipoPreguntaFormacion;
        explicacion?: string | null;
        orden: number;
        opciones: Array<{
            texto: string;
            textoRelacionado?: string | null;
            esCorrecta: boolean;
            orden: number;
        }>;
    }>;
};

export type ResponderEvaluacionFormacionPayload = {
    respuestas: Array<{
        preguntaId: string;
        opcionId?: string | null;
        opcionIds?: string[];
        texto?: string | null;
        relaciones?: Array<{ itemId: string; relacionId: string }>;
    }>;
};

export type TipoPreguntaFormacion =
    | "SeleccionUnica"
    | "SeleccionMultiple"
    | "VerdaderoFalso"
    | "ListaDesplegable"
    | "RespuestaCorta"
    | "RespuestaLarga"
    | "Relacionar";

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
        tipo: TipoPreguntaFormacion;
        opcionSeleccionadaId?: string | null;
        respuesta: string;
        correcta?: boolean | null;
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

export async function getDestinatariosFormacion(): Promise<FormacionDestinatarios> {
    return apiFetch<FormacionDestinatarios>("/api/formacion/destinatarios");
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
