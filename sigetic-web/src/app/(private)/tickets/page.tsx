"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock3,
    History,
    Plus,
    Search,
    Star,
    Ticket,
    Trash2,
} from "lucide-react";
import {
    deleteTicket,
    getTickets,
    registrarEncuestaTicket,
    type TicketMesaAyuda,
} from "@/lib/tickets-api";
import { getStoredUser } from "@/lib/auth";
import { canManageTechnicalAssets, canViewAllTickets } from "@/lib/permissions";

type SurveyDraft = {
    calificacionTiempo: string;
    calificacionAtencion: string;
    calificacionAmabilidad: string;
    calificacionSolucion: string;
    comentarioSatisfaccion: string;
};

const defaultSurveyDraft: SurveyDraft = {
    calificacionTiempo: "5",
    calificacionAtencion: "5",
    calificacionAmabilidad: "5",
    calificacionSolucion: "5",
    comentarioSatisfaccion: "",
};

export default function TicketsPage() {
    const currentUser = getStoredUser();
    const canSeeAllTickets = canViewAllTickets(currentUser);
    const canManageTickets = canManageTechnicalAssets(currentUser);

    const [tickets, setTickets] = useState<TicketMesaAyuda[]>([]);
    const [surveyDrafts, setSurveyDrafts] = useState<Record<string, SurveyDraft>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [savingSurveyId, setSavingSurveyId] = useState("");
    const [deletingTicketId, setDeletingTicketId] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("error");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("Todos");
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

    const visibleTickets = useMemo(() => {
        return tickets.filter(
            (item) =>
                canSeeAllTickets ||
                item.solicitante.trim().toLowerCase() ===
                    (currentUser?.nombreCompleto ?? "").trim().toLowerCase() ||
                item.solicitante.trim().toLowerCase() ===
                    (currentUser?.correo ?? "").trim().toLowerCase()
        );
    }, [canSeeAllTickets, currentUser?.correo, currentUser?.nombreCompleto, tickets]);

    useEffect(() => {
        async function loadTickets() {
            try {
                setIsLoading(true);
                setMessage("");
                setTickets(await getTickets());
            } catch (error) {
                setMessageType("error");
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar la mesa de ayuda."
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadTickets();
    }, []);

    const filteredTickets = useMemo(() => {
        const normalizedSearch = searchTerm.toLowerCase().trim();

        return visibleTickets.filter((item) => {
            const matchesSearch =
                !normalizedSearch ||
                [
                    item.codigo,
                    item.solicitante,
                    item.dependencia,
                    item.categoria,
                    item.prioridad,
                    item.estado,
                    item.responsableAsignado ?? "",
                    item.descripcion,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "Todos" || item.estado === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [visibleTickets, searchTerm, statusFilter]);

    const abiertos = visibleTickets.filter(
        (item) =>
            !item.estado.toLowerCase().includes("cerrado") &&
            !item.estado.toLowerCase().includes("resuelto")
    ).length;

    const enProceso = visibleTickets.filter((item) =>
        item.estado.toLowerCase().includes("proceso")
    ).length;

    const cerrados = visibleTickets.filter(
        (item) =>
            item.estado.toLowerCase().includes("cerrado") ||
            item.estado.toLowerCase().includes("resuelto")
    ).length;

    const estados = [
        "Todos",
        ...Array.from(new Set(visibleTickets.map((ticket) => ticket.estado))),
    ];

    function updateSurveyDraft(id: string, patch: Partial<SurveyDraft>) {
        setSurveyDrafts((current) => ({
            ...current,
            [id]: {
                ...(current[id] ?? defaultSurveyDraft),
                ...patch,
            },
        }));
    }

    async function handleSurveySubmit(
        event: React.FormEvent<HTMLFormElement>,
        ticket: TicketMesaAyuda
    ) {
        event.preventDefault();

        const draft = surveyDrafts[ticket.id] ?? defaultSurveyDraft;

        try {
            setSavingSurveyId(ticket.id);
            setMessage("");

            const updated = await registrarEncuestaTicket(ticket.id, {
                calificacionTiempo: Number(draft.calificacionTiempo),
                calificacionAtencion: Number(draft.calificacionAtencion),
                calificacionAmabilidad: Number(draft.calificacionAmabilidad),
                calificacionSolucion: Number(draft.calificacionSolucion),
                comentarioSatisfaccion: draft.comentarioSatisfaccion || null,
            });

            setTickets((current) =>
                current.map((item) => (item.id === updated.id ? updated : item))
            );
            setMessageType("success");
            setMessage("Encuesta de satisfacción registrada correctamente.");
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible registrar la encuesta."
            );
        } finally {
            setSavingSurveyId("");
        }
    }

    async function handleDeleteTicket(ticket: TicketMesaAyuda) {
        const confirmed = window.confirm(
            `¿Eliminar el ticket ${ticket.codigo}? Quedará auditado y saldrá de la vista operativa.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingTicketId(ticket.id);
            setMessage("");

            await deleteTicket(ticket.id);

            setTickets((current) => current.filter((item) => item.id !== ticket.id));
            setMessageType("success");
            setMessage(`Ticket ${ticket.codigo} eliminado correctamente.`);
        } catch (error) {
            setMessageType("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "No fue posible eliminar el ticket."
            );
        } finally {
            setDeletingTicketId("");
        }
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[1.35rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Mesa de ayuda
                        </p>
                        <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">
                            Solicitudes de soporte TIC
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                            Registra, consulta y prioriza solicitudes internas de soporte,
                            mantenimientos y atenciones tecnológicas.
                        </p>
                    </div>

                    <Link
                        href="/tickets/nuevo"
                        className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo ticket
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-4">
                <SummaryCard icon={Ticket} label="Tickets" value={visibleTickets.length} />
                <SummaryCard icon={AlertCircle} label="Abiertos" value={abiertos} />
                <SummaryCard icon={Clock3} label="En proceso" value={enProceso} />
                <SummaryCard icon={CheckCircle2} label="Cerrados" value={cerrados} />
            </section>

            <section className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-[#0b8f3a] focus-within:ring-4 focus-within:ring-green-700/10">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar por código, solicitante, dependencia o categoría"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                    >
                        {estados.map((estado) => (
                            <option key={estado}>{estado}</option>
                        ))}
                    </select>
                </div>

                {message ? (
                    <div
                        className={`mt-5 rounded-2xl px-4 py-3 text-sm font-bold ${
                            messageType === "success"
                                ? "bg-green-50 text-[#006b2e]"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                        {message}
                    </div>
                ) : null}
            </section>

            <section className="grid gap-3">
                {isLoading ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                        Cargando tickets...
                    </div>
                ) : null}

                {!isLoading && filteredTickets.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
                        No hay tickets registrados con esos filtros.
                    </div>
                ) : null}

                {!isLoading
                    ? filteredTickets.map((item) => {
                          const isExpanded = expandedTicketId === item.id;

                          return (
                              <article
                                  key={item.id}
                                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                              >
                                  <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                                      <div>
                                          <div className="flex flex-wrap items-center gap-2">
                                              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-[#006b2e]">
                                                  {item.codigo}
                                              </span>
                                              <span
                                                  className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                                                      item.estado
                                                  )}`}
                                              >
                                                  {item.estado}
                                              </span>
                                              <span
                                                  className={`rounded-full px-3 py-1 text-xs font-black ${getPriorityClass(
                                                      item.prioridad
                                                  )}`}
                                              >
                                                  {item.prioridad}
                                              </span>
                                          </div>

                                          <h3 className="mt-3 text-base font-black text-[#14233b]">
                                              {item.categoria}
                                          </h3>
                                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                                              {item.descripcion}
                                          </p>
                                      </div>

                                      <div className="rounded-xl bg-slate-50 p-3 text-sm">
                                          <p className="truncate font-black text-[#14233b]">
                                              {item.solicitante}
                                          </p>
                                          <p className="mt-1 truncate text-xs text-slate-500">
                                              {item.dependencia}
                                          </p>
                                          <p className="mt-3 text-xs font-bold text-slate-500">
                                              Fecha: {item.fechaSolicitud}
                                          </p>
                                          <p className="mt-1 text-xs font-bold text-slate-500">
                                              Responsable: {item.responsableAsignado || "Sin asignar"}
                                          </p>
                                          <div className="mt-3 grid gap-2">
                                              <button
                                                  type="button"
                                                  onClick={() =>
                                                      setExpandedTicketId(
                                                          isExpanded ? null : item.id
                                                      )
                                                  }
                                                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-[#006b2e] transition hover:bg-green-50"
                                              >
                                                  {isExpanded ? (
                                                      <ChevronUp className="h-4 w-4" />
                                                  ) : (
                                                      <ChevronDown className="h-4 w-4" />
                                                  )}
                                                  {isExpanded ? "Ocultar seguimiento" : "Ver seguimiento"}
                                              </button>

                                              {canManageTickets ? (
                                                  <button
                                                      type="button"
                                                      onClick={() => handleDeleteTicket(item)}
                                                      disabled={deletingTicketId === item.id}
                                                      className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                  >
                                                      <Trash2 className="h-4 w-4" />
                                                      {deletingTicketId === item.id
                                                          ? "Eliminando..."
                                                          : "Eliminar ticket"}
                                                  </button>
                                              ) : null}
                                          </div>
                                      </div>
                                  </div>

                                  {isExpanded ? (
                                      <TicketDetail ticket={item} />
                                  ) : null}

                                  {isExpanded && isTicketClosed(item) ? (
                                      <SurveyBox
                                          ticket={item}
                                          draft={surveyDrafts[item.id] ?? defaultSurveyDraft}
                                          isSaving={savingSurveyId === item.id}
                                          onChange={(patch) => updateSurveyDraft(item.id, patch)}
                                          onSubmit={(event) => handleSurveySubmit(event, item)}
                                      />
                                  ) : null}
                              </article>
                          );
                      })
                    : null}
            </section>
        </div>
    );
}

function TicketDetail({ ticket }: { ticket: TicketMesaAyuda }) {
    return (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 text-sm md:grid-cols-2">
                <InfoItem label="Código" value={ticket.codigo} />
                <InfoItem label="Estado" value={ticket.estado} />
                <InfoItem label="Prioridad" value={ticket.prioridad} />
                <InfoItem label="Compromiso" value={ticket.fechaCompromiso || "Sin fecha"} />
                <InfoItem label="Equipo" value={ticket.equipoCodigo || "No asociado"} />
                <InfoItem label="Impresora" value={ticket.impresoraCodigo || "No asociada"} />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
                <TextPanel title="Descripción" value={ticket.descripcion} />
                <TextPanel
                    title="Solución / avance"
                    value={ticket.solucion || "Aún no se registra solución técnica."}
                />
            </div>

            <HistoryPanel ticket={ticket} />
        </div>
    );
}

function HistoryPanel({ ticket }: { ticket: TicketMesaAyuda }) {
    const historial = ticket.historial ?? [];

    return (
        <div className="mt-4 rounded-xl bg-white p-3">
            <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-[#006b2e]" />
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Auditoría del ticket
                </p>
            </div>

            {historial.length === 0 ? (
                <p className="mt-3 text-sm font-bold text-slate-500">
                    Este ticket no tiene eventos de auditoría registrados todavía.
                </p>
            ) : (
                <div className="mt-3 grid gap-2">
                    {historial.map((evento) => (
                        <div
                            key={evento.id}
                            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-black text-[#14233b]">
                                    {evento.tipoEvento}
                                </p>
                                <p className="text-xs font-bold text-slate-500">
                                    {formatDateTime(evento.fechaEventoUtc)}
                                </p>
                            </div>
                            <p className="mt-1 text-xs font-bold text-[#006b2e]">
                                Usuario: {evento.usuario}
                            </p>
                            {evento.estadoAnterior || evento.estadoNuevo ? (
                                <p className="mt-1 text-xs text-slate-500">
                                    Estado: {evento.estadoAnterior || "Sin estado"} →{" "}
                                    {evento.estadoNuevo || "Sin estado"}
                                </p>
                            ) : null}
                            {evento.detalle ? (
                                <p className="mt-1 text-xs leading-5 text-slate-600">
                                    {evento.detalle}
                                </p>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SurveyBox({
    ticket,
    draft,
    isSaving,
    onChange,
    onSubmit,
}: {
    ticket: TicketMesaAyuda;
    draft: SurveyDraft;
    isSaving: boolean;
    onChange: (patch: Partial<SurveyDraft>) => void;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
    if (ticket.fechaEncuestaUtc) {
        const promedio =
            ((ticket.calificacionTiempo ?? 0) +
                (ticket.calificacionAtencion ?? 0) +
                (ticket.calificacionAmabilidad ?? 0) +
                (ticket.calificacionSolucion ?? 0)) /
            4;

        return (
            <div className="mt-4 rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black text-[#006b2e]">
                    <Star className="h-4 w-4" />
                    Encuesta registrada: {promedio.toFixed(1)} / 5
                </div>
                {ticket.comentarioSatisfaccion ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        {ticket.comentarioSatisfaccion}
                    </p>
                ) : null}
            </div>
        );
    }

    return (
        <form
            onSubmit={onSubmit}
            className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
            <div className="mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#006b2e]" />
                <p className="text-sm font-black text-[#14233b]">
                    Encuesta de satisfacción del servicio
                </p>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
                <RatingField
                    label="Tiempo"
                    value={draft.calificacionTiempo}
                    onChange={(value) => onChange({ calificacionTiempo: value })}
                />
                <RatingField
                    label="Atención"
                    value={draft.calificacionAtencion}
                    onChange={(value) => onChange({ calificacionAtencion: value })}
                />
                <RatingField
                    label="Amabilidad"
                    value={draft.calificacionAmabilidad}
                    onChange={(value) => onChange({ calificacionAmabilidad: value })}
                />
                <RatingField
                    label="Solución"
                    value={draft.calificacionSolucion}
                    onChange={(value) => onChange({ calificacionSolucion: value })}
                />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                <input
                    value={draft.comentarioSatisfaccion}
                    onChange={(event) =>
                        onChange({ comentarioSatisfaccion: event.target.value })
                    }
                    placeholder="Comentario opcional de satisfacción"
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                />
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-[#006b2e] px-5 text-sm font-black text-white disabled:opacity-70"
                >
                    {isSaving ? "Guardando..." : "Guardar encuesta"}
                </button>
            </div>
        </form>
    );
}

function RatingField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="grid gap-1">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
            >
                {[1, 2, 3, 4, 5].map((score) => (
                    <option key={score} value={String(score)}>
                        {score}
                    </option>
                ))}
            </select>
        </label>
    );
}

function SummaryCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ElementType;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        {label}
                    </p>
                    <p className="text-2xl font-black text-[#14233b]">{value}</p>
                </div>
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-1 break-words text-sm font-bold text-[#14233b]">
                {value}
            </p>
        </div>
    );
}

function TextPanel({ title, value }: { title: string; value: string }) {
    return (
        <div className="rounded-xl bg-white p-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                {title}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
        </div>
    );
}

function isTicketClosed(ticket: TicketMesaAyuda) {
    const status = ticket.estado.toLowerCase();

    return status.includes("cerrado") || status.includes("resuelto");
}

function getStatusClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized.includes("cerrado") || normalized.includes("resuelto")) {
        return "bg-green-50 text-[#006b2e]";
    }

    if (normalized.includes("proceso")) {
        return "bg-yellow-50 text-yellow-700";
    }

    return "bg-blue-50 text-blue-700";
}

function getPriorityClass(priority: string) {
    const normalized = priority.toLowerCase();

    if (normalized.includes("alta") || normalized.includes("critica")) {
        return "bg-red-50 text-red-700";
    }

    if (normalized.includes("media")) {
        return "bg-yellow-50 text-yellow-700";
    }

    return "bg-slate-100 text-slate-600";
}

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-CO", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}
