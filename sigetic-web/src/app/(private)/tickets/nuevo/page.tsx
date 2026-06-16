"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Ticket } from "lucide-react";
import { getDependencias, type Dependencia } from "@/lib/administracion-api";
import { getStoredUser } from "@/lib/auth";
import { createTicket, type CrearTicketPayload } from "@/lib/tickets-api";
import { canViewAllTickets } from "@/lib/permissions";

const categorias = [
    "Soporte técnico",
    "Mantenimiento preventivo",
    "Mantenimiento correctivo",
    "Impresora / consumibles",
    "Red o conectividad",
    "Software",
    "Otro",
];

const prioridades = ["Baja", "Media", "Alta", "Crítica"];
const estados = ["Abierto", "En proceso", "Resuelto", "Cerrado"];

function today() {
    return new Date().toISOString().slice(0, 10);
}

export default function NuevoTicketPage() {
    const router = useRouter();
    const currentUser = getStoredUser();
    const canManageTicketFields = canViewAllTickets(currentUser);
    const [dependencias, setDependencias] = useState<Dependencia[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [form, setForm] = useState<CrearTicketPayload>({
        fechaSolicitud: today(),
        solicitante: currentUser?.nombreCompleto ?? "",
        dependencia: "",
        categoria: "Soporte técnico",
        prioridad: "Media",
        estado: "Abierto",
        descripcion: "",
        responsableAsignado: "",
        equipoCodigo: "",
        impresoraCodigo: "",
        fechaCompromiso: "",
        solucion: "",
    });

    useEffect(() => {
        async function loadDependencias() {
            try {
                const data = await getDependencias();
                setDependencias(data);
                setForm((current) => ({
                    ...current,
                    dependencia: current.dependencia || data[0]?.nombre || "",
                }));
            } catch {
                setDependencias([]);
            }
        }

        loadDependencias();
    }, []);

    useEffect(() => {
        if (!canManageTicketFields && currentUser?.nombreCompleto) {
            setForm((current) => ({
                ...current,
                solicitante: currentUser.nombreCompleto,
                estado: "Abierto",
                responsableAsignado: "",
                fechaCompromiso: "",
                solucion: "",
            }));
        }
    }, [canManageTicketFields, currentUser?.nombreCompleto]);

    function updateField<K extends keyof CrearTicketPayload>(
        key: K,
        value: CrearTicketPayload[K]
    ) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setIsSubmitting(true);
            setMessage("");

            await createTicket({
                ...form,
                responsableAsignado: form.responsableAsignado || null,
                equipoCodigo: form.equipoCodigo || null,
                impresoraCodigo: form.impresoraCodigo || null,
                fechaCompromiso: form.fechaCompromiso || null,
                solucion: form.solucion || null,
            });

            router.push("/tickets");
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible crear el ticket."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <Link
                    href="/tickets"
                    className="inline-flex items-center gap-2 text-sm font-black text-white/90"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a mesa de ayuda
                </Link>

                <div className="mt-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                        <Ticket className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Nuevo ticket
                        </p>
                        <h2 className="mt-1 text-3xl font-black tracking-[-0.05em]">
                            Registrar solicitud de soporte
                        </h2>
                    </div>
                </div>
            </section>

            <form
                onSubmit={handleSubmit}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Fecha de solicitud">
                        <input
                            type="date"
                            value={form.fechaSolicitud}
                            onChange={(event) =>
                                updateField("fechaSolicitud", event.target.value)
                            }
                            className="input"
                        />
                    </Field>

                    <Field label="Solicitante">
                        <input
                            value={form.solicitante}
                            onChange={(event) =>
                                updateField("solicitante", event.target.value)
                            }
                            readOnly={!canManageTicketFields}
                            placeholder="Nombre del funcionario"
                            className={`input ${!canManageTicketFields ? "bg-slate-50" : ""}`}
                        />
                    </Field>

                    <Field label="Dependencia">
                        {dependencias.length > 0 ? (
                            <select
                                value={form.dependencia}
                                onChange={(event) =>
                                    updateField("dependencia", event.target.value)
                                }
                                className="input"
                            >
                                {dependencias.map((dependencia) => (
                                    <option key={dependencia.id} value={dependencia.nombre}>
                                        {dependencia.nombre}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                value={form.dependencia}
                                onChange={(event) =>
                                    updateField("dependencia", event.target.value)
                                }
                                placeholder="Dependencia"
                                className="input"
                            />
                        )}
                    </Field>

                    <Field label="Categoría">
                        <select
                            value={form.categoria}
                            onChange={(event) =>
                                updateField("categoria", event.target.value)
                            }
                            className="input"
                        >
                            {categorias.map((categoria) => (
                                <option key={categoria}>{categoria}</option>
                            ))}
                        </select>
                    </Field>

                    <Field label="Prioridad">
                        <select
                            value={form.prioridad}
                            onChange={(event) =>
                                updateField("prioridad", event.target.value)
                            }
                            className="input"
                        >
                            {prioridades.map((prioridad) => (
                                <option key={prioridad}>{prioridad}</option>
                            ))}
                        </select>
                    </Field>

                    {canManageTicketFields ? (
                        <>
                            <Field label="Estado">
                                <select
                                    value={form.estado}
                                    onChange={(event) => updateField("estado", event.target.value)}
                                    className="input"
                                >
                                    {estados.map((estado) => (
                                        <option key={estado}>{estado}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Responsable asignado">
                                <input
                                    value={form.responsableAsignado ?? ""}
                                    onChange={(event) =>
                                        updateField("responsableAsignado", event.target.value)
                                    }
                                    placeholder="Administrador TIC o técnico"
                                    className="input"
                                />
                            </Field>

                            <Field label="Fecha compromiso">
                                <input
                                    type="date"
                                    value={form.fechaCompromiso ?? ""}
                                    onChange={(event) =>
                                        updateField("fechaCompromiso", event.target.value)
                                    }
                                    className="input"
                                />
                            </Field>
                        </>
                    ) : null}

                    <Field label="Código equipo relacionado">
                        <input
                            value={form.equipoCodigo ?? ""}
                            onChange={(event) =>
                                updateField("equipoCodigo", event.target.value)
                            }
                            placeholder="Ej. TIC-001"
                            className="input"
                        />
                    </Field>

                    <Field label="Código impresora relacionada">
                        <input
                            value={form.impresoraCodigo ?? ""}
                            onChange={(event) =>
                                updateField("impresoraCodigo", event.target.value)
                            }
                            placeholder="Ej. IMP-001"
                            className="input"
                        />
                    </Field>
                </div>

                <div className="mt-4 grid gap-4">
                    <Field label="Descripción de la solicitud">
                        <textarea
                            value={form.descripcion}
                            onChange={(event) =>
                                updateField("descripcion", event.target.value)
                            }
                            rows={5}
                            placeholder="Describe la falla, solicitud o necesidad reportada."
                            className="input min-h-32 py-3"
                        />
                    </Field>

                    {canManageTicketFields ? (
                        <Field label="Solución o cierre">
                            <textarea
                                value={form.solucion ?? ""}
                                onChange={(event) =>
                                    updateField("solucion", event.target.value)
                                }
                                rows={4}
                                placeholder="Opcional. Registra la solución si ya fue atendido."
                                className="input min-h-28 py-3"
                            />
                        </Field>
                    ) : null}
                </div>

                {message ? (
                    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        {message}
                    </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Link
                        href="/tickets"
                        className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 text-sm font-black text-slate-600"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? "Guardando..." : "Guardar ticket"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>
            {children}
        </label>
    );
}
