"use client";

import {
    Bell,
    ChevronRight,
    CircleHelp,
    LogOut,
    Menu,
    Search,
    UserRound,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    clearSession,
    getStoredUser,
    SESSION_CHANGED_EVENT,
    type AuthUser,
} from "@/lib/auth";
import { canAccessPath } from "@/lib/permissions";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
    "/dashboard": {
        title: "Dashboard SIGETIC",
        subtitle: "Panel administrativo",
    },
    "/inventario": {
        title: "Inventario TIC",
        subtitle: "Gestión de activos tecnológicos",
    },
    "/inventario/nuevo": {
        title: "Registrar equipo",
        subtitle: "Nuevo activo tecnológico",
    },
    "/hojas-de-vida": {
        title: "Hojas de vida",
        subtitle: "Trazabilidad técnica de equipos",
    },
    "/impresoras": {
        title: "Impresoras",
        subtitle: "Gestión de impresoras institucionales",
    },
    "/consumibles": {
        title: "Consumibles",
        subtitle: "Control de tóner, tintas e insumos",
    },
    "/tickets": {
        title: "Mesa de ayuda",
        subtitle: "Gestión de solicitudes de soporte",
    },
    "/tickets/nuevo": {
        title: "Nuevo ticket",
        subtitle: "Solicitud de soporte TIC",
    },
    "/ayuda": {
        title: "Ayuda",
        subtitle: "Preguntas frecuentes y orientación",
    },
    "/dependencias": {
        title: "Dependencias",
        subtitle: "Áreas administrativas y operativas",
    },
    "/funcionarios": {
        title: "Funcionarios",
        subtitle: "Usuarios internos y asignaciones",
    },
    "/reportes": {
        title: "Reportes",
        subtitle: "Indicadores y trazabilidad institucional",
    },
    "/analitica": {
        title: "Analítica SIGETIC",
        subtitle: "Consumo, costos, alertas y satisfacción",
    },
    "/configuracion": {
        title: "Configuración",
        subtitle: "Parámetros generales del sistema",
    },
    "/configuracion/usuarios": {
        title: "Usuarios",
        subtitle: "Administración de cuentas y roles",
    },
};

const searchableItems = [
    {
        title: "Dashboard",
        description: "Indicadores generales del sistema",
        href: "/dashboard",
        keywords: "inicio tablero indicadores",
    },
    {
        title: "Inventario TIC",
        description: "Activos tecnológicos y hojas de vida",
        href: "/inventario",
        keywords: "equipo computador serial activo hoja vida",
    },
    {
        title: "Impresoras",
        description: "Equipos de impresión y consumibles asociados",
        href: "/impresoras",
        keywords: "impresora tinta tóner páginas",
    },
    {
        title: "Consumibles",
        description: "Stock, entradas, salidas y costos",
        href: "/consumibles",
        keywords: "tinta tóner stock inventario consumible costo",
    },
    {
        title: "Mesa de ayuda",
        description: "Solicitudes de soporte técnico",
        href: "/tickets",
        keywords: "ticket soporte solicitud mesa ayuda falla",
    },
    {
        title: "Crear ticket",
        description: "Registrar una nueva solicitud",
        href: "/tickets/nuevo",
        keywords: "nuevo ticket crear solicitud soporte",
    },
    {
        title: "Reportes",
        description: "Exportaciones e informes institucionales",
        href: "/reportes",
        keywords: "excel pdf informe exportar mensual",
    },
    {
        title: "Analítica",
        description: "Consumo, costos, alertas y satisfacción",
        href: "/analitica",
        keywords: "analítica presupuesto alerta stock semáforo",
    },
    {
        title: "Ayuda",
        description: "Preguntas frecuentes y uso del sistema",
        href: "/ayuda",
        keywords: "preguntas frecuentes ayuda manual soporte",
    },
    {
        title: "Usuarios",
        description: "Administración de usuarios y roles",
        href: "/configuracion/usuarios",
        keywords: "usuario rol permisos cuenta",
    },
];

const notificationItems = [
    {
        title: "Tickets pendientes",
        description: "Abrir mesa de ayuda para revisar solicitudes.",
        href: "/tickets",
    },
    {
        title: "Stock de consumibles",
        description: "Verificar existencias, entradas y salidas.",
        href: "/consumibles",
    },
    {
        title: "Analítica institucional",
        description: "Consultar alertas, costos y satisfacción.",
        href: "/analitica",
    },
    {
        title: "Preguntas frecuentes",
        description: "Ver cómo crear tickets y usar los módulos.",
        href: "/ayuda",
    },
];

function getPageTitle(pathname: string) {
    if (pathname === "/impresoras/nueva") {
        return {
            title: "Registrar impresora",
            subtitle: "Nueva hoja de vida de impresora",
        };
    }

    if (pathname.startsWith("/impresoras/") && pathname.endsWith("/editar")) {
        return {
            title: "Editar impresora",
            subtitle: "Actualización de hoja de vida",
        };
    }

    if (pathname.startsWith("/impresoras/") && pathname !== "/impresoras/nueva") {
        return {
            title: "Hoja de vida de impresora",
            subtitle: "Detalle técnico y consumibles",
        };
    }

    if (pathname.startsWith("/inventario/") && pathname.endsWith("/editar")) {
        return {
            title: "Editar equipo",
            subtitle: "Actualización del activo tecnológico",
        };
    }

    if (pathname.startsWith("/inventario/") && pathname !== "/inventario/nuevo") {
        return {
            title: "Hoja de vida TIC",
            subtitle: "Detalle del activo tecnológico",
        };
    }

    return (
        pageTitles[pathname] ?? {
            title: "SIGETIC",
            subtitle: "Sistema Integral de Gestión TIC",
        }
    );
}

export function AppTopbar() {
    const pathname = usePathname();
    const router = useRouter();
    const currentPage = getPageTitle(pathname);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    useEffect(() => {
        const refreshUser = () => setUser(getStoredUser());

        refreshUser();
        window.addEventListener(SESSION_CHANGED_EVENT, refreshUser);
        window.addEventListener("storage", refreshUser);

        return () => {
            window.removeEventListener(SESSION_CHANGED_EVENT, refreshUser);
            window.removeEventListener("storage", refreshUser);
        };
    }, []);

    const visibleSearchResults = useMemo(() => {
        const normalizedTerm = searchTerm.trim().toLowerCase();

        return searchableItems
            .filter((item) => canAccessPath(user, item.href))
            .filter((item) => {
                if (!normalizedTerm) return true;

                const searchableText =
                    `${item.title} ${item.description} ${item.keywords}`.toLowerCase();
                return searchableText.includes(normalizedTerm);
            })
            .slice(0, 6);
    }, [searchTerm, user]);

    const visibleNotifications = useMemo(
        () => notificationItems.filter((item) => canAccessPath(user, item.href)),
        [user],
    );

    function handleLogout() {
        clearSession();
        router.replace("/login");
    }

    function handleNavigate(href: string) {
        setSearchTerm("");
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
        router.push(href);
    }

    function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (visibleSearchResults.length > 0) {
            handleNavigate(visibleSearchResults[0].href);
        }
    }

    return (
        <header className="sticky top-0 z-20 border-b border-green-900/10 bg-white/85 px-4 py-4 backdrop-blur sm:px-5 lg:px-6">
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm lg:hidden"
                    >
                        <Menu className="h-5 w-5 text-slate-600" />
                    </button>

                    <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#006b2e]">
                            {currentPage.subtitle}
                        </p>

                        <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.04em] text-[#14233b] md:text-3xl">
                            {currentPage.title}
                        </h1>
                    </div>
                </div>

                <div className="flex min-w-0 flex-wrap items-center gap-3 md:flex-nowrap md:justify-end">
                    <div className="relative hidden md:block">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10"
                        >
                            <Search className="h-4 w-4 text-slate-400" />

                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setIsSearchOpen(true);
                                }}
                                onFocus={() => setIsSearchOpen(true)}
                                placeholder="Buscar módulo, ticket o equipo..."
                                className="w-56 bg-transparent text-sm outline-none placeholder:text-slate-400 xl:w-72"
                            />
                        </form>

                        {isSearchOpen && searchTerm.trim() ? (
                            <div className="absolute right-0 top-[3.25rem] z-30 w-[22rem] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                                {visibleSearchResults.length > 0 ? (
                                    visibleSearchResults.map((item) => (
                                        <button
                                            key={item.href}
                                            type="button"
                                            onClick={() => handleNavigate(item.href)}
                                            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-green-50"
                                        >
                                            <span>
                                                <span className="block text-sm font-black text-[#14233b]">
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs text-slate-500">
                                                    {item.description}
                                                </span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-4 text-sm text-slate-500">
                                        No hay resultados disponibles para tu rol.
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsNotificationsOpen((current) => !current)}
                            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-green-50"
                            aria-label="Abrir notificaciones"
                        >
                            <Bell className="h-5 w-5 text-slate-600" />
                            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#f4c400]" />
                        </button>

                        {isNotificationsOpen ? (
                            <div className="absolute right-0 top-[3.25rem] z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                                    <CircleHelp className="h-4 w-4 text-[#006b2e]" />
                                    <p className="text-sm font-black text-[#14233b]">
                                        Centro de actividad
                                    </p>
                                </div>

                                {visibleNotifications.length > 0 ? (
                                    visibleNotifications.map((item) => (
                                        <button
                                            key={item.href}
                                            type="button"
                                            onClick={() => handleNavigate(item.href)}
                                            className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-green-50"
                                        >
                                            <span>
                                                <span className="block text-sm font-black text-[#14233b]">
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                                                    {item.description}
                                                </span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-4 text-sm text-slate-500">
                                        No tienes notificaciones disponibles.
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="flex h-11 min-w-0 max-w-[16rem] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                            <UserRound className="h-4 w-4" />
                        </div>

                        <div className="hidden md:block">
                            <p className="max-w-[160px] truncate text-xs font-black text-slate-800">
                                {user?.nombreCompleto ?? "Usuario SIGETIC"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                                {user?.rol ?? "Sin rol"}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            title="Cerrar sesión"
                            className="ml-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
