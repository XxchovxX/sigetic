import type { ElementType } from "react";
import type { AuthUser } from "@/lib/auth";

export const ROLES = {
    admin: "Administrador",
    ticAdmin: "Administrador TIC",
    systemsAssistant: "Auxiliar de Sistemas",
    financialSecretary: "Secretario Administrativo Financiero",
    officeSecretary: "Secretario de Despacho",
    safAssistant: "Auxiliar Administrativo SAF",
    employee: "Funcionario",
    readOnly: "Consulta / Control Interno",
} as const;

const allRoles = Object.values(ROLES);
const technicalRoles = [ROLES.admin, ROLES.ticAdmin, ROLES.systemsAssistant];
const consumableRoles = [
    ROLES.admin,
    ROLES.ticAdmin,
    ROLES.systemsAssistant,
    ROLES.financialSecretary,
    ROLES.safAssistant,
];

export type PermissionMenuItem = {
    title: string;
    href: string;
    icon: ElementType;
    roles: string[];
};

export function hasRole(user: AuthUser | null, roles: string[]) {
    return Boolean(user && roles.includes(user.rol));
}

export function canManageUsers(user: AuthUser | null) {
    return hasRole(user, [ROLES.admin]);
}

export function canManageTechnicalAssets(user: AuthUser | null) {
    return hasRole(user, technicalRoles);
}

export function canManageConsumibles(user: AuthUser | null) {
    return hasRole(user, consumableRoles);
}

export function canViewAllTickets(user: AuthUser | null) {
    return hasRole(user, [
        ROLES.admin,
        ROLES.ticAdmin,
        ROLES.systemsAssistant,
        ROLES.financialSecretary,
        ROLES.safAssistant,
        ROLES.readOnly,
    ]);
}

export function getDefaultPathForRole(role: string) {
    if (role === ROLES.employee || role === ROLES.safAssistant) {
        return "/tickets";
    }

    return "/dashboard";
}

export function canAccessPath(user: AuthUser | null, pathname: string) {
    if (!user) return false;

    if (user.rol === ROLES.admin) return true;

    if (pathname === "/dashboard") {
        return hasRole(user, [
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.officeSecretary,
            ROLES.readOnly,
        ]);
    }

    if (pathname.startsWith("/configuracion") ||
        pathname.startsWith("/dependencias") ||
        pathname.startsWith("/funcionarios")) {
        return false;
    }

    if (pathname.startsWith("/inventario/nuevo") ||
        pathname.startsWith("/impresoras/nueva") ||
        ((pathname.startsWith("/inventario") || pathname.startsWith("/impresoras")) &&
            pathname.endsWith("/editar"))) {
        return hasRole(user, [ROLES.ticAdmin, ROLES.systemsAssistant]);
    }

    if (pathname.startsWith("/inventario") ||
        pathname.startsWith("/hojas-de-vida") ||
        pathname.startsWith("/impresoras")) {
        return hasRole(user, [
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ]);
    }

    if (pathname.startsWith("/programacion")) {
        return hasRole(user, [
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ]);
    }

    if (pathname.startsWith("/consumibles")) {
        return hasRole(user, [
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.safAssistant,
        ]);
    }

    if (pathname.startsWith("/tickets")) {
        return hasRole(user, allRoles);
    }

    if (pathname.startsWith("/ayuda")) {
        return hasRole(user, allRoles);
    }

    if (pathname.startsWith("/auditoria")) {
        return hasRole(user, [ROLES.admin, ROLES.ticAdmin]);
    }

    if (pathname.startsWith("/reportes") || pathname.startsWith("/analitica")) {
        return hasRole(user, [
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ]);
    }

    return false;
}
