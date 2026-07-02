"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ElementType } from "react";
import {
    BarChart3,
    Building2,
    CalendarClock,
    ClipboardList,
    CircleHelp,
    Headset,
    Home,
    Monitor,
    Package,
    Printer,
    ScrollText,
    Settings,
    UsersRound,
} from "lucide-react";
import {
    getStoredUser,
    SESSION_CHANGED_EVENT,
    type AuthUser,
} from "@/lib/auth";
import { ROLES } from "@/lib/permissions";

type MenuItem = {
    title: string;
    href: string;
    icon: ElementType;
    roles: string[];
};

const menuItems: MenuItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.officeSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Inventario TIC",
        href: "/inventario",
        icon: Monitor,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Hojas de vida",
        href: "/hojas-de-vida",
        icon: ClipboardList,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Impresoras",
        href: "/impresoras",
        icon: Printer,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Programacion",
        href: "/programacion",
        icon: CalendarClock,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Consumibles",
        href: "/consumibles",
        icon: Package,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.safAssistant,
        ],
    },
    {
        title: "Mesa de ayuda",
        href: "/tickets",
        icon: Headset,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.safAssistant,
            ROLES.employee,
            ROLES.officeSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Ayuda",
        href: "/ayuda",
        icon: CircleHelp,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.safAssistant,
            ROLES.employee,
            ROLES.officeSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Dependencias",
        href: "/dependencias",
        icon: Building2,
        roles: [ROLES.admin],
    },
    {
        title: "Funcionarios",
        href: "/funcionarios",
        icon: UsersRound,
        roles: [ROLES.admin],
    },
    {
        title: "Reportes",
        href: "/reportes",
        icon: BarChart3,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Analítica",
        href: "/analitica",
        icon: BarChart3,
        roles: [
            ROLES.admin,
            ROLES.ticAdmin,
            ROLES.systemsAssistant,
            ROLES.financialSecretary,
            ROLES.readOnly,
        ],
    },
    {
        title: "Auditoría",
        href: "/auditoria",
        icon: ScrollText,
        roles: [ROLES.admin, ROLES.ticAdmin],
    },
    {
        title: "Configuración",
        href: "/configuracion",
        icon: Settings,
        roles: [ROLES.admin],
    },
];

function canSeeItem(user: AuthUser | null, item: MenuItem) {
    if (!user) return false;

    return item.roles.includes(user.rol);
}

export function AppSidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<AuthUser | null>(null);

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

    const visibleItems = menuItems.filter((item) => canSeeItem(user, item));

    return (
        <aside className="hidden w-72 border-r border-green-900/10 bg-white px-4 py-5 lg:block">
            <div className="mb-8 rounded-[1.7rem] bg-gradient-to-br from-[#006b2e] to-[#0b8f3a] p-5 text-white shadow-xl shadow-green-900/20">
                <div className="mb-4 flex h-20 w-full items-center justify-center rounded-2xl bg-white p-3 shadow-lg shadow-green-950/20">
                    <Image
                        src="/identity/logo-alcaldia.png"
                        alt="Logo Alcaldía de San Carlos de Guaroa"
                        width={592}
                        height={386}
                        priority
                        className="h-full w-auto object-contain"
                    />
                </div>

                <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                    SIGETIC
                </p>

                <h2 className="mt-2 text-xl font-black tracking-[-0.05em]">
                    Gestión TIC
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/75">
                    Sistema Integral de Gestión TIC institucional.
                </p>
            </div>

            <nav className="space-y-1">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                                isActive
                                    ? "bg-green-50 text-[#006b2e]"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-[#006b2e]"
                            }`}
                        >
                            <Icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Sesión activa
                </p>

                <p className="mt-2 truncate text-sm font-black text-[#14233b]">
                    {user?.nombreCompleto ?? "Usuario SIGETIC"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    {user?.rol ?? "Sin rol asignado"}
                </p>
            </div>

        </aside>
    );
}
