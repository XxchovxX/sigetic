"use client";

import { CircleHelp, ClipboardList, Headset, Package, ShieldCheck } from "lucide-react";
import { getStoredUser } from "@/lib/auth";

const faqs = [
    {
        title: "¿Cómo creo una solicitud de soporte?",
        answer:
            "Ingresa a Mesa de ayuda, selecciona Nuevo ticket, describe la falla o necesidad y guarda la solicitud. El sistema conserva el historial para que puedas revisar el avance.",
    },
    {
        title: "¿Por qué no veo todos los módulos?",
        answer:
            "Cada usuario ve solo lo necesario para su rol. Funcionarios normales solo ven Mesa de ayuda; los roles técnicos gestionan equipos, impresoras y mantenimientos; los roles administrativos ven consumibles, reportes o analítica según corresponda.",
    },
    {
        title: "¿Cómo reviso el avance de mis tickets?",
        answer:
            "En Mesa de ayuda puedes ver el estado, responsable asignado, prioridad y solución cuando el ticket sea atendido. Los funcionarios solo ven sus propias solicitudes.",
    },
    {
        title: "¿Quién puede mover consumibles?",
        answer:
            "Administrador, Administrador TIC, Auxiliar de Sistemas, Secretario Administrativo Financiero y Auxiliar Administrativo SAF pueden registrar entradas, salidas o ajustes de consumibles según su función.",
    },
    {
        title: "¿Qué son las hojas de vida?",
        answer:
            "Son registros técnicos de equipos e impresoras. Incluyen datos base, mantenimientos, bajas, consumibles asociados y documentos PDF de soporte.",
    },
    {
        title: "¿Para qué sirve Analítica?",
        answer:
            "Analítica resume consumo por dependencia, costos de consumibles, alertas de stock, próximos mantenimientos, semáforo de activos y satisfacción de tickets.",
    },
    {
        title: "¿Qué hago si no puedo ingresar?",
        answer:
            "Verifica correo y contraseña. Si el problema continúa, solicita al Administrador SIGETIC revisar tu usuario, rol y estado activo.",
    },
];

export default function AyudaPage() {
    const user = getStoredUser();

    return (
        <div className="space-y-6">
            <section className="rounded-xl bg-[#006b2e] p-6 text-white shadow-lg shadow-green-900/15">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                            Centro de ayuda
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.03em]">
                            Preguntas frecuentes SIGETIC
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Guía rápida para usar el sistema según tu rol y consultar las
                            dudas más comunes sin depender de soporte técnico.
                        </p>
                    </div>

                    <div className="rounded-xl bg-white/10 p-4">
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
                <HelpCard icon={Headset} title="Mesa de ayuda" text="Crea y consulta solicitudes." />
                <HelpCard icon={Package} title="Consumibles" text="Entradas, salidas y stock." />
                <HelpCard icon={ClipboardList} title="Hojas de vida" text="Trazabilidad técnica." />
                <HelpCard icon={ShieldCheck} title="Roles" text="Acceso según responsabilidad." />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                {faqs.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
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

            <section className="rounded-xl border border-green-100 bg-green-50 p-5">
                <p className="text-sm font-black text-[#006b2e]">
                    Soporte interno
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                    Si necesitas una corrección de datos, cambio de rol o recuperación de
                    acceso, comunícate con el Administrador SIGETIC o registra un ticket en
                    Mesa de ayuda.
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
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-black text-[#14233b]">{title}</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">{text}</p>
        </article>
    );
}
