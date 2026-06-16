import { getApiUrl } from "@/lib/api-url";

const TOKEN_KEY = "sigetic_token";
const USER_KEY = "sigetic_user";
export const SESSION_CHANGED_EVENT = "sigetic-session-changed";

export type AuthUser = {
    id: string;
    nombreCompleto: string;
    correo: string;
    rolId: string;
    rol: string;
    permisos: string[];
};

export type LoginResponse = {
    token: string;
    expiraEnUtc: string;
    usuario: AuthUser;
};

export type LoginPayload = {
    correo: string;
    password: string;
};

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let message = "No fue posible completar la solicitud.";

        try {
            const error = await response.json();

            if (error?.message) {
                message = error.message;
            }
        } catch {
            if (response.status === 401) {
                message = "Correo o contraseña incorrectos.";
            }
        }

        throw new Error(message);
    }

    return response.json() as Promise<T>;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return handleResponse<LoginResponse>(response);
}

export async function getCurrentUser(token: string): Promise<AuthUser> {
    const response = await fetch(`${getApiUrl()}/api/auth/me`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
    });

    return handleResponse<AuthUser>(response);
}

export function saveSession(response: LoginResponse) {
    if (typeof window === "undefined") return;

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function getToken() {
    if (typeof window === "undefined") return null;

    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;

    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) return null;

    try {
        return JSON.parse(rawUser) as AuthUser;
    } catch {
        return null;
    }
}

export function clearSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function isAuthenticated() {
    return Boolean(getToken());
}

export function userHasRole(user: AuthUser | null, roles: string[]) {
    if (!user) return false;

    return roles.includes(user.rol);
}
