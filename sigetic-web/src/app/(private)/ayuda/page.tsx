"use client";

import {
    BarChart3,
    CircleHelp,
    ClipboardList,
    Headset,
    Monitor,
    Package,
    ShieldCheck,
    UserCog,
} from "lucide-react";
import { getStoredUser } from "@/lib/auth";

const roleManuals = [
    {
        role: "Administrador",
        title: "Administrador general",
        scope: "Control total del sistema, usuarios, roles, auditoría y parametrización.",
        tasks: [
            "Crear, editar, desactivar o eliminar usuarios cuando sea necesario.",
            "Asignar roles correctos según la responsabilidad de cada persona.",
            "Consultar auditoría para revisar quién creó, editó o eliminó información.",
            "Supervisar inventario, consumibles, mesa de ayuda, reportes y analítica.",
            "Validar la configuración productiva, backups y seguridad de acceso.",
        ],
    },
    {
        role: "Administrador TIC",
        title: "Administrador TIC",
        scope: "Gestión técnica del inventario, mantenimientos, impresoras y seguimiento.",
        tasks: [
            "Registrar equipos, impresoras y hojas de vida técnicas.",
            "Actualizar mantenimientos preventivos o correctivos con firma interna.",
            "Gestionar consumibles, stock y movimientos técnicos.",
            "Atender tickets, cambiar estados y registrar solución.",
            "Consultar auditoría operativa y trazabilidad técnica.",
        ],
    },
    {
        role: "Auxiliar de Sistemas",
        title: "Auxiliar de sistemas",
        scope: "Ejecución operativa de soporte, mantenimientos y consumibles.",
        tasks: [
            "Crear y actualizar activos tecnológicos cuando sea autorizado.",
            "Registrar mantenimientos, entregas de tintas y movimientos de stock.",
            "Atender tickets asignados y dejar evidencia de la solución.",
            "Consultar reportes técnicos para seguimiento de actividades.",
        ],
    },
    {
        role: "Secretario Administrativo Financiero",
        title: "Secretario Administrativo Financiero",
        scope: "Consulta directiva, reportes, analítica, tickets y control de consumibles.",
        tasks: [
            "Consultar dashboard, reportes y analítica institucional.",
            "Crear tickets de soporte y revisar su avance.",
            "Actualizar consumibles cuando corresponda al control administrativo.",
            "Exportar informes para seguimiento mensual y toma de decisiones.",
        ],
    },
    {
        role: "Auxiliar Administrativo SAF",
        title: "Auxiliar Administrativo SAF",
        scope: "Gestión administrativa de consumibles y solicitudes de soporte.",
        tasks: [
            "Registrar entradas, salidas o ajustes de consumibles.",
            "Crear tickets de soporte propios.",
            "Revisar estado e historial de las solicitudes registradas.",
        ],
    },
    {
        role: "Secretario de Despacho",
        title: "Secretario de despacho",
        scope: "Consulta de indicadores generales y creación de solicitudes.",
        tasks: [
            "Ver el dashboard autorizado para seguimiento general.",
            "Crear tickets de soporte para necesidades de la dependencia.",
            "Consultar el avance de sus solicitudes.",
        ],
    },
    {
        role: "Funcionario",
        title: "Funcionario",
        scope: "Uso básico de mesa de ayuda.",
        tasks: [
            "Crear tickets de soporte técnico interno.",
            "Consultar solo el historial y avance de sus propios tickets.",
            "Registrar encuesta de satisfacción cuando el ticket sea atendido.",
        ],
    },
    {
        role: "Consulta / Control Interno",
        title: "Consulta / Control Interno",
        scope: "Consulta y verificación sin edición operativa.",
        tasks: [
            "Revisar dashboard, reportes, analítica e inventario autorizado.",
            "Crear tickets si requiere soporte.",
            "Validar trazabilidad funcional desde los reportes disponibles.",
        ],
    },
];

const faqs = [
    {
        title: "¿Cómo creo una solicitud de soporte?",
        answer:
            "Ingresa a Mesa de ayuda, selecciona Nuevo ticket, describe la falla o necesidad y guarda la solicitud. El sistema conserva el historial para consultar el avance.",
    },
    {
        title: "¿Por qué no veo todos los módulos?",
        answer:
            "Cada usuario ve solo lo necesario para su rol. Esto evita cambios accidentales y protege la información operativa del sistema.",
    },
    {
        title: "¿Qué registra la auditoría?",
        answer:
            "La auditoría registra altas, actualizaciones y eliminaciones: usuario, rol, módulo, fecha, ruta, entidad afectada y resumen del cambio.",
    },
    {
        title: "¿Quién puede revisar la auditoría?",
        answer:
            "Por seguridad, solo Administrador y Administrador TIC pueden consultar la auditoría global del sistema.",
    },
    {
        title: "¿Qué son las hojas de vida?",
        answer:
            "Son registros técnicos de equipos e impresoras. Incluyen datos base, mantenimientos, bajas, consumibles asociados y documentos PDF de soporte.",
    },
    {
        title: "¿Qué hago si no puedo ingresar?",
        answer:
            "Verifica correo y contraseña. Si el problema continúa, solicita al Administrador SIGETIC revisar tu usuario, rol y estado activo.",
    },
];

const quickCards = [
    {
        icon: Headset,
        title: "Mesa de ayuda",
        text: "Tickets, estados, historial y satisfacción.",
    },
    {
        icon: Monitor,
        title: "Inventario TIC",
        text: "Equipos, hojas de vida, mantenimientos y bajas.",
    },
    {
        icon: Package,
        title: "Consumibles",
        text: "Entradas, salidas, stock mínimo y costos.",
    },
    {
        icon: ShieldCheck,
        title: "Auditoría",
        text: "Trazabilidad de procesos y cambios del sistema.",
    },
];

export default function AyudaPage() {
    const user = getStoredUser();
    const currentManual = roleManuals.find((item) => item.role === user?.rol);

    return (
        <div className="space-y-6">
            <section className="rounded-[1.7rem] bg-[#006b2e] p-6 text-white shadow-lg shadow-green-900/15">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                            Centro de ayuda
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
                            Manual de usuario SIGETIC
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Consulta las funciones permitidas para cada rol y las dudas
                            frecuentes del sistema.
                        </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                        <p className="text-xs font-black uppercase tracking-wide text-white/70">
                            Sesión
                        </p>
                        <p className="mt-1 text-sm font-black">
                            {user?.nombreCompleto ?? "Usuario SIGETIC"}
                        </p>
                        <p className="mt-1 text-xs text-white/75">
                            {user?.rol ?? "Sin rol asignado"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {quickCards.map((card) => (
                    <HelpCard
                        key={card.title}
                        icon={card.icon}
                        title={card.title}
                        text={card.text}
                    />
                ))}
            </section>

            {currentManual ? (
                <section className="rounded-[1.7rem] border border-green-100 bg-green-50 p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#006b2e]">
                            <UserCog className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                                Tu rol
                            </p>
                            <h3 className="text-xl font-black text-[#14233b]">
                                {currentManual.title}
                            </h3>
                        </div>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">
                        {currentManual.scope}
                    </p>
                    <ul className="mt-4 grid gap-2 md:grid-cols-2">
                        {currentManual.tasks.map((task) => (
                            <li
                                key={task}
                                className="rounded-2xl border border-green-100 bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-700"
                            >
                                {task}
                            </li>
                        ))}
                    </ul>
                </section>
            ) : null}

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                        <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                            Manuales por rol
                        </p>
                        <h3 className="text-xl font-black text-[#14233b]">
                            Alcance funcional
                        </h3>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    {roleManuals.map((manual) => (
                        <article
                            key={manual.role}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#006b2e]">
                                {manual.role}
                            </p>
                            <h4 className="mt-2 text-lg font-black text-[#14233b]">
                                {manual.title}
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                {manual.scope}
                            </p>
                            <ul className="mt-3 space-y-2">
                                {manual.tasks.map((task) => (
                                    <li
                                        key={task}
                                        className="text-sm leading-6 text-slate-600"
                                    >
                                        • {task}
                                    </li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                {faqs.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
                    >
                        <div className="mb-3 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                                <CircleHelp className="h-5 w-5" />
                            </div>
                            <h3 className="text-base font-black text-[#14233b]">
                                {item.title}
                            </h3>
                        </div>
                        <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-[1.7rem] border border-green-100 bg-green-50 p-5">
                <div className="mb-3 flex items-center gap-3 text-[#006b2e]">
                    <BarChart3 className="h-5 w-5" />
                    <p className="text-sm font-black">Soporte interno</p>
                </div>
                <p className="text-sm leading-7 text-slate-600">
                    Si necesitas corrección de datos, cambio de rol o recuperación de
                    acceso, comunícate con el Administrador SIGETIC o registra un ticket
                    en Mesa de ayuda.
                </p>
            </section>
        </div>
    );
}

function HelpCard({
    icon: Icon,
    title,
    text,
}: {
    icon: React.ElementType;
    title: string;
    text: string;
}) {
    return (
        <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-[#14233b]">{title}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{text}</p>
        </article>
    );
}
