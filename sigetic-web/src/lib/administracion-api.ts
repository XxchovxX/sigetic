import { getToken } from "@/lib/auth";
import { getApiUrl } from "@/lib/api-url";

export type Rol = {
    id: string;
    nombre: string;
    descripcion: string;
    esSistema: boolean;
    activo: boolean;
    fechaCreacionUtc: string;
};

export type Usuario = {
    id: string;
    nombreCompleto: string;
    correo: string;
    rolId: string;
    rol: string;
    activo: boolean;
    fechaCreacionUtc: string;
    ultimoAccesoUtc?: string | null;
};

export type Dependencia = {
    id: string;
    nombre: string;
    codigo: string;
    responsable?: string | null;
    correo?: string | null;
    activa: boolean;
    fechaCreacionUtc: string;
};

export type Funcionario = {
    id: string;
    nombreCompleto: string;
    documento: string;
    cargo: string;
    dependenciaId: string;
    dependencia: string;
    correo?: string | null;
    telefono?: string | null;
    activo: boolean;
    fechaCreacionUtc: string;
};

export type CrearRolPayload = {
    nombre: string;
    descripcion: string;
};

export type CrearUsuarioPayload = {
    nombreCompleto: string;
    correo: string;
    password: string;
    rolId: string;
};

export type ActualizarUsuarioPayload = {
    nombreCompleto: string;
    correo: string;
    rolId: string;
    activo: boolean;
};

export type CambiarPasswordUsuarioPayload = {
    nuevoPassword: string;
};

export type CrearDependenciaPayload = {
    nombre: string;
    codigo: string;
    responsable?: string | null;
    correo?: string | null;
};

export type CrearFuncionarioPayload = {
    nombreCompleto: string;
    documento: string;
    cargo: string;
    dependenciaId: string;
    correo?: string | null;
    telefono?: string | null;
};

async function adminFetch<T>(
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
        const message = await getErrorMessage(response);

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function getErrorMessage(response: Response): Promise<string> {
    if (response.status === 401) {
        return "No autorizado. Inicia sesión nuevamente.";
    }

    if (response.status === 403) {
        return "No tienes permisos para realizar esta acción.";
    }

    try {
        const error = await response.clone().json();

        if (typeof error?.message === "string" && error.message.trim()) {
            return error.message;
        }

        if (typeof error?.title === "string" && error.title.trim()) {
            return error.title;
        }

        if (error?.errors && typeof error.errors === "object") {
            const validationMessages = Object.values(error.errors)
                .flat()
                .filter((value): value is string => typeof value === "string");

            if (validationMessages.length > 0) {
                return validationMessages.join(" ");
            }
        }
    } catch {
        const text = await response.text();

        if (text.trim()) {
            return text;
        }
    }

    if (response.status === 409) {
        return "El registro ya existe o entra en conflicto con información registrada.";
    }

    return "No fue posible completar la solicitud. Revisa los datos e intenta nuevamente.";
}

export async function getRoles(): Promise<Rol[]> {
    return adminFetch<Rol[]>("/api/administracion/roles");
}

export async function createRol(payload: CrearRolPayload): Promise<Rol> {
    return adminFetch<Rol>("/api/administracion/roles", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getUsuarios(): Promise<Usuario[]> {
    return adminFetch<Usuario[]>("/api/administracion/usuarios");
}

export async function createUsuario(
    payload: CrearUsuarioPayload
): Promise<Usuario> {
    return adminFetch<Usuario>("/api/administracion/usuarios", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function updateUsuario(
    id: string,
    payload: ActualizarUsuarioPayload
): Promise<Usuario> {
    return adminFetch<Usuario>(`/api/administracion/usuarios/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function cambiarPasswordUsuario(
    id: string,
    payload: CambiarPasswordUsuarioPayload
): Promise<void> {
    await adminFetch<void>(`/api/administracion/usuarios/${id}/password`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export async function deleteUsuario(id: string): Promise<void> {
    await adminFetch<void>(`/api/administracion/usuarios/${id}`, {
        method: "DELETE",
    });
}

export async function getDependencias(): Promise<Dependencia[]> {
    return adminFetch<Dependencia[]>("/api/administracion/dependencias");
}

export async function createDependencia(
    payload: CrearDependenciaPayload
): Promise<Dependencia> {
    return adminFetch<Dependencia>("/api/administracion/dependencias", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export async function getFuncionarios(): Promise<Funcionario[]> {
    return adminFetch<Funcionario[]>("/api/administracion/funcionarios");
}

export async function createFuncionario(
    payload: CrearFuncionarioPayload
): Promise<Funcionario> {
    return adminFetch<Funcionario>("/api/administracion/funcionarios", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}
