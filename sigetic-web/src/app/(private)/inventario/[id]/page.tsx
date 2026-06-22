"use client";

import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SignatureImageInput } from "@/components/forms/SignatureImageInput";
import {
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    ClipboardList,
    Computer,
    Cpu,
    Download,
    Edit3,
    FileWarning,
    HardDrive,
    MapPin,
    Network,
    Plus,
    Save,
    ShieldCheck,
    UserRound,
    Wrench,
} from "lucide-react";
import {
    createBajaEquipo,
    createMantenimientoEquipo,
    getBajaEquipoByEquipoId,
    getEquipoById,
    getMantenimientosByEquipoId,
    type BajaEquipo,
    type Equipo,
    type MantenimientoEquipo,
} from "@/lib/api";

const HEADER_LOGO_PATH = "/pdf/escudo-san-carlos.png";
const FOOTER_IMAGE_PATH = "/pdf/pie-pagina-alcaldia.png";

const maintenanceSchema = z.object({
    tipoMantenimiento: z.string().min(1, "Seleccione el tipo de mantenimiento."),
    fechaMantenimiento: z.string().min(1, "La fecha es obligatoria."),
    tecnicoResponsable: z.string().min(2, "El técnico responsable es obligatorio."),
    diagnostico: z.string().min(5, "El diagnóstico debe ser más detallado."),
    actividadesRealizadas: z
        .string()
        .min(5, "Las actividades realizadas son obligatorias."),
    repuestosUtilizados: z.string().optional(),
    estadoResultante: z.string().min(1, "Seleccione el estado resultante."),
    proximaRevision: z.string().optional(),
    observaciones: z.string().optional(),
    firmaTecnico: z.string().optional(),
    firmaRecibe: z.string().optional(),
    nombreRecibe: z.string().optional(),
    documentoRecibe: z.string().optional(),
});

const bajaSchema = z.object({
    fechaBaja: z.string().min(1, "La fecha de baja es obligatoria."),
    motivoBaja: z.string().min(8, "El motivo de baja debe ser más detallado."),
    responsableBaja: z.string().min(2, "El responsable de la baja es obligatorio."),
    estadoFisico: z.string().min(1, "Seleccione el estado físico."),
    disposicionFinal: z.string().min(1, "Seleccione la disposición final."),
    observaciones: z.string().optional(),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
type BajaFormValues = z.infer<typeof bajaSchema>;

const maintenanceTypes = [
    "Preventivo",
    "Correctivo",
    "Diagnóstico",
    "Actualización",
    "Configuración",
    "Limpieza física",
    "Instalación de software",
    "Cambio de repuesto",
    "Otro",
];

const resultingStatuses = [
    "Activo",
    "En mantenimiento",
    "Pendiente de repuesto",
    "Pendiente de revisión",
    "Dado de baja",
];

const physicalStatuses = [
    "Bueno",
    "Regular",
    "Malo",
    "No funcional",
    "Obsoleto",
    "Con daño físico",
    "Con falla eléctrica",
];

const finalDispositions = [
    "Pendiente de disposición administrativa",
    "Reubicación interna",
    "Almacenamiento temporal",
    "Aprovechamiento de partes",
    "Disposición final autorizada",
    "Donación",
    "Devolución a proveedor",
    "Otro",
];

function getStatusClass(status: string) {
    const normalized = status.toLowerCase();

    if (normalized.includes("activo")) return "bg-green-50 text-[#006b2e]";
    if (normalized.includes("mantenimiento")) return "bg-yellow-50 text-yellow-700";
    if (normalized.includes("baja")) return "bg-red-50 text-red-700";

    return "bg-slate-100 text-slate-600";
}

function formatDate(value: string) {
    if (!value) return "No registrada";

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const date = new Date(Number(year), Number(month) - 1, Number(day));

        return new Intl.DateTimeFormat("es-CO", {
            year: "numeric",
            month: "long",
            day: "2-digit",
        }).format(date);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("es-CO", {
        year: "numeric",
        month: "long",
        day: "2-digit",
    }).format(date);
}

function sanitizeFileName(value: string) {
    return value
        .toLowerCase()
        .replaceAll(" ", "-")
        .replace(/[^a-z0-9-_]/g, "");
}

async function loadImageAsDataUrl(path: string): Promise<string | null> {
    try {
        const response = await fetch(path);

        if (!response.ok) return null;

        const blob = await response.blob();

        return await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function getImageFormat(dataUrl: string) {
    return dataUrl.includes("image/jpeg") || dataUrl.includes("image/jpg")
        ? "JPEG"
        : "PNG";
}

async function exportEquipmentLifeSheetPdf(
    equipo: Equipo,
    mantenimientos: MantenimientoEquipo[],
    baja: BajaEquipo | null
) {
    const [logoImage, footerImage] = await Promise.all([
        loadImageAsDataUrl(HEADER_LOGO_PATH),
        loadImageAsDataUrl(FOOTER_IMAGE_PATH),
    ]);

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "letter",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 14;
    const contentTop = 48;
    const footerHeight = 26;
    const contentBottom = pageHeight - footerHeight - 10;

    let y = contentTop;

    function drawHeader(pageNumber: number, totalPages: number) {
        const headerX = 16;
        const headerY = 12;
        const headerW = pageWidth - 32;
        const headerH = 22;

        const logoW = 25;
        const titleW = 88;

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);

        doc.rect(headerX, headerY, headerW, headerH);
        doc.line(headerX + logoW, headerY, headerX + logoW, headerY + headerH);
        doc.line(
            headerX + logoW + titleW,
            headerY,
            headerX + logoW + titleW,
            headerY + headerH
        );

        if (logoImage) {
            doc.addImage(
                logoImage,
                getImageFormat(logoImage),
                headerX + 3.5,
                headerY + 2,
                18,
                18
            );
        } else {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(0, 107, 46);
            doc.text("SIGETIC", headerX + 5, headerY + 12);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(
            "HOJA DE VIDA DE EQUIPOS",
            headerX + logoW + titleW / 2,
            headerY + 13.5,
            { align: "center" }
        );

        const metaX = headerX + logoW + titleW;
        const rowH = headerH / 4;
        const currentYear = new Date().getFullYear();

        doc.line(metaX, headerY + rowH, headerX + headerW, headerY + rowH);
        doc.line(metaX, headerY + rowH * 2, headerX + headerW, headerY + rowH * 2);
        doc.line(metaX, headerY + rowH * 3, headerX + headerW, headerY + rowH * 3);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        doc.text("CÓDIGO: TIC-HV-01", metaX + 2, headerY + 4);
        doc.text("VERSIÓN: 01", metaX + 2, headerY + rowH + 4);
        doc.text(`FECHA: JUNIO DE ${currentYear}`, metaX + 2, headerY + rowH * 2 + 4);
        doc.text(
            `PÁGINA: ${pageNumber} DE ${totalPages}`,
            metaX + 2,
            headerY + rowH * 3 + 4
        );
    }

    function drawFooter() {
        if (footerImage) {
            doc.addImage(
                footerImage,
                getImageFormat(footerImage),
                0,
                pageHeight - footerHeight,
                pageWidth,
                footerHeight
            );
            return;
        }

        doc.setFillColor(0, 107, 46);
        doc.rect(0, pageHeight - 18, pageWidth, 18, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text("Alcaldía de San Carlos de Guaroa - SIGETIC", marginX, pageHeight - 8);
    }

    function drawHeaderFooterAllPages() {
        const totalPages = doc.getNumberOfPages();

        for (let page = 1; page <= totalPages; page += 1) {
            doc.setPage(page);
            drawHeader(page, totalPages);
            drawFooter();
        }
    }

    function checkPageBreak(requiredSpace: number) {
        if (y + requiredSpace > contentBottom) {
            doc.addPage();
            y = contentTop;
        }
    }

    function addSectionTitle(title: string) {
        checkPageBreak(16);

        doc.setFillColor(231, 244, 236);
        doc.roundedRect(marginX, y, pageWidth - marginX * 2, 9, 2, 2, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(0, 107, 46);
        doc.text(title.toUpperCase(), marginX + 4, y + 6);

        y += 14;
    }

    function addRow(label: string, value: string) {
        const safeValue = value || "No registrado";
        const wrappedValue = doc.splitTextToSize(safeValue, 108);
        const rowHeight = Math.max(8, wrappedValue.length * 4.6 + 3);

        checkPageBreak(rowHeight + 2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(86, 104, 130);
        doc.text(label.toUpperCase(), marginX, y + 4);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(20, 35, 59);
        doc.text(wrappedValue, marginX + 58, y + 4);

        doc.setDrawColor(225, 231, 240);
        doc.line(marginX, y + rowHeight, pageWidth - marginX, y + rowHeight);

        y += rowHeight + 2;
    }

    function addMainTitle() {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(20, 35, 59);
        doc.text(`Activo TIC: ${equipo.codigoInterno}`, marginX, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(86, 104, 130);
        doc.text(`${equipo.tipoEquipo} - ${equipo.marca} ${equipo.modelo}`, marginX, y + 7);

        doc.setFillColor(
            equipo.estado.toLowerCase().includes("baja") ? 254 : 231,
            equipo.estado.toLowerCase().includes("baja") ? 226 : 244,
            equipo.estado.toLowerCase().includes("baja") ? 226 : 236
        );
        doc.roundedRect(pageWidth - marginX - 42, y - 6, 42, 11, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(
            equipo.estado.toLowerCase().includes("baja") ? 185 : 0,
            equipo.estado.toLowerCase().includes("baja") ? 28 : 107,
            equipo.estado.toLowerCase().includes("baja") ? 28 : 46
        );
        doc.text(equipo.estado, pageWidth - marginX - 21, y + 1, {
            align: "center",
        });

        y += 20;
    }

    addMainTitle();

    addSectionTitle("1. Identificación del activo");
    addRow("Código interno", equipo.codigoInterno);
    addRow("Tipo de equipo", equipo.tipoEquipo);
    addRow("Marca", equipo.marca);
    addRow("Modelo", equipo.modelo);
    addRow("Serial", equipo.serial);
    addRow("Estado", equipo.estado);

    addSectionTitle("2. Asignación administrativa");
    addRow("Dependencia", equipo.dependencia);
    addRow("Funcionario asignado", equipo.funcionarioAsignado);
    addRow("Ubicación física", equipo.ubicacionFisica);
    addRow("Fecha de ingreso", formatDate(equipo.fechaIngreso));

    addSectionTitle("3. Características técnicas");
    addRow("Procesador", equipo.procesador);
    addRow("Memoria RAM", equipo.memoriaRam);
    addRow("Almacenamiento", equipo.almacenamiento);
    addRow("Sistema operativo", equipo.sistemaOperativo);

    addSectionTitle("4. Red y conectividad");
    addRow("Dirección IP", equipo.direccionIp || "No registrada");
    addRow("Dirección MAC", equipo.direccionMac || "No registrada");

    addSectionTitle("5. Observaciones");
    addRow("Observaciones", equipo.observaciones || "Sin observaciones registradas.");

    addSectionTitle("6. Historial de mantenimientos");

    if (mantenimientos.length === 0) {
        addRow("Registro", "No se registran mantenimientos asociados a este activo.");
    } else {
        mantenimientos.forEach((item, index) => {
            addRow(
                `Mantenimiento ${index + 1}`,
                `${item.tipoMantenimiento} | Fecha: ${formatDate(
                    item.fechaMantenimiento
                )} | Técnico: ${item.tecnicoResponsable} | Estado final: ${item.estadoResultante
                }`
            );
            addRow("Diagnóstico", item.diagnostico);
            addRow("Actividades", item.actividadesRealizadas);

            if (item.repuestosUtilizados) addRow("Repuestos", item.repuestosUtilizados);
            if (item.observaciones) addRow("Observaciones", item.observaciones);
            if (item.fechaFirmaUtc) {
                addRow(
                    "Firma interna",
                    `Técnico: ${isSignatureImage(item.firmaTecnico) ? "Firma escaneada adjunta" : item.firmaTecnico || item.tecnicoResponsable} | Recibe: ${isSignatureImage(item.firmaRecibe) ? "Firma escaneada adjunta" : item.firmaRecibe || item.nombreRecibe || "No registrado"}${item.documentoRecibe ? ` | Documento: ${item.documentoRecibe}` : ""} | Firmado electrónicamente para uso interno`
                );
            }
        });
    }

    addSectionTitle("7. Baja del activo");

    if (!baja) {
        addRow("Estado de baja", "El activo no tiene una baja registrada.");
    } else {
        addRow("Fecha de baja", formatDate(baja.fechaBaja));
        addRow("Responsable", baja.responsableBaja);
        addRow("Estado físico", baja.estadoFisico);
        addRow("Disposición final", baja.disposicionFinal);
        addRow("Motivo de baja", baja.motivoBaja);
        addRow("Observaciones", baja.observaciones || "Sin observaciones registradas.");
    }

    addSectionTitle("8. Trazabilidad");
    addRow("Fecha de creación", formatDate(equipo.fechaCreacionUtc));
    addRow(
        "Nota",
        "Documento generado automáticamente desde SIGETIC como soporte de inventario, control, trazabilidad y seguimiento del activo tecnológico."
    );

    y += 8;
    checkPageBreak(28);

    doc.setDrawColor(180, 190, 205);
    doc.line(marginX, y, marginX + 70, y);
    doc.line(pageWidth - marginX - 70, y, pageWidth - marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(70, 82, 100);
    doc.text("Responsable TIC", marginX + 35, y + 5, { align: "center" });
    doc.text("Funcionario responsable", pageWidth - marginX - 35, y + 5, {
        align: "center",
    });

    drawHeaderFooterAllPages();

    doc.save(`hoja-de-vida-${sanitizeFileName(equipo.codigoInterno)}.pdf`);
}

export default function EquipmentDetailPage() {
    const params = useParams<{ id: string }>();

    const [equipo, setEquipo] = useState<Equipo | null>(null);
    const [mantenimientos, setMantenimientos] = useState<MantenimientoEquipo[]>([]);
    const [baja, setBaja] = useState<BajaEquipo | null>(null);
    const [showBajaForm, setShowBajaForm] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMaintenances, setIsLoadingMaintenances] = useState(false);
    const [error, setError] = useState("");
    const [maintenanceMessage, setMaintenanceMessage] = useState("");
    const [bajaMessage, setBajaMessage] = useState("");

    const maintenanceForm = useForm<MaintenanceFormValues>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            tipoMantenimiento: "Preventivo",
            fechaMantenimiento: new Date().toISOString().slice(0, 10),
            tecnicoResponsable: "Profesional TIC",
            diagnostico: "",
            actividadesRealizadas: "",
            repuestosUtilizados: "",
            estadoResultante: "Activo",
            proximaRevision: "",
            observaciones: "",
            firmaTecnico: "",
            firmaRecibe: "",
            nombreRecibe: "",
            documentoRecibe: "",
        },
    });

    const bajaForm = useForm<BajaFormValues>({
        resolver: zodResolver(bajaSchema),
        defaultValues: {
            fechaBaja: new Date().toISOString().slice(0, 10),
            motivoBaja: "",
            responsableBaja: "Profesional TIC",
            estadoFisico: "Obsoleto",
            disposicionFinal: "Pendiente de disposición administrativa",
            observaciones: "",
        },
    });

    const isEquipoDadoDeBaja =
        equipo?.estado?.toLowerCase().includes("baja") || baja !== null;

    async function loadMantenimientos(equipoId: string) {
        try {
            setIsLoadingMaintenances(true);
            const data = await getMantenimientosByEquipoId(equipoId);
            setMantenimientos(data);
        } catch {
            setMaintenanceMessage("No fue posible cargar el historial de mantenimientos.");
        } finally {
            setIsLoadingMaintenances(false);
        }
    }

    async function loadBaja(equipoId: string) {
        const data = await getBajaEquipoByEquipoId(equipoId);
        setBaja(data);
    }

    useEffect(() => {
        async function loadEquipo() {
            try {
                setIsLoading(true);
                setError("");

                const data = await getEquipoById(params.id);
                setEquipo(data);

                await Promise.all([
                    loadMantenimientos(data.id),
                    loadBaja(data.id),
                ]);
            } catch (err) {
                const message =
                    err instanceof Error
                        ? err.message
                        : "No fue posible cargar la hoja de vida del equipo.";

                setError(message);
            } finally {
                setIsLoading(false);
            }
        }

        if (params.id) {
            loadEquipo();
        }
    }, [params.id]);

    async function onSubmitMaintenance(data: MaintenanceFormValues) {
        if (!equipo || isEquipoDadoDeBaja) return;

        try {
            setMaintenanceMessage("");

            await createMantenimientoEquipo(equipo.id, {
                tipoMantenimiento: data.tipoMantenimiento,
                fechaMantenimiento: data.fechaMantenimiento,
                tecnicoResponsable: data.tecnicoResponsable,
                diagnostico: data.diagnostico,
                actividadesRealizadas: data.actividadesRealizadas,
                repuestosUtilizados: data.repuestosUtilizados || null,
                estadoResultante: data.estadoResultante,
                proximaRevision: data.proximaRevision || null,
                observaciones: data.observaciones || null,
                firmaTecnico: data.firmaTecnico || null,
                firmaRecibe: data.firmaRecibe || null,
                nombreRecibe: data.nombreRecibe || null,
                documentoRecibe: data.documentoRecibe || null,
            });

            const updatedEquipo = await getEquipoById(equipo.id);
            setEquipo(updatedEquipo);

            maintenanceForm.reset({
                tipoMantenimiento: "Preventivo",
                fechaMantenimiento: new Date().toISOString().slice(0, 10),
                tecnicoResponsable: "Profesional TIC",
                diagnostico: "",
                actividadesRealizadas: "",
                repuestosUtilizados: "",
                estadoResultante: "Activo",
                proximaRevision: "",
                observaciones: "",
                firmaTecnico: "",
                firmaRecibe: "",
                nombreRecibe: "",
                documentoRecibe: "",
            });

            setMaintenanceMessage("Mantenimiento registrado correctamente.");
            await loadMantenimientos(equipo.id);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "No fue posible registrar el mantenimiento.";

            setMaintenanceMessage(message);
        }
    }

    async function onSubmitBaja(data: BajaFormValues) {
        if (!equipo || baja) return;

        try {
            setBajaMessage("");

            await createBajaEquipo(equipo.id, {
                fechaBaja: data.fechaBaja,
                motivoBaja: data.motivoBaja,
                responsableBaja: data.responsableBaja,
                estadoFisico: data.estadoFisico,
                disposicionFinal: data.disposicionFinal,
                observaciones: data.observaciones || null,
            });

            const [updatedEquipo, bajaRegistrada] = await Promise.all([
                getEquipoById(equipo.id),
                getBajaEquipoByEquipoId(equipo.id),
            ]);

            setEquipo(updatedEquipo);
            setBaja(bajaRegistrada);
            setShowBajaForm(false);
            setBajaMessage("Baja registrada correctamente.");
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : "No fue posible registrar la baja del equipo.";

            setBajaMessage(message);
        }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="rounded-2xl bg-green-50 px-5 py-4 text-sm font-bold text-[#006b2e]">
                    Cargando hoja de vida del activo TIC...
                </div>
            </div>
        );
    }

    if (error || !equipo) {
        return (
            <div className="rounded-[1.7rem] border border-red-100 bg-red-50 p-6 text-red-700">
                <h2 className="text-xl font-black">No fue posible cargar el equipo</h2>
                <p className="mt-2 text-sm font-bold">
                    {error || "No se encontró información del activo solicitado."}
                </p>

                <Link
                    href="/inventario"
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-bold text-red-700 shadow-sm"
                >
                    Volver al inventario
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link
                            href="/inventario"
                            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-white/90 transition hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al inventario
                        </Link>

                        <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                            Hoja de vida del activo TIC
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] md:text-4xl">
                            {equipo.codigoInterno}
                        </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85">
                            {equipo.tipoEquipo} · {equipo.marca} {equipo.modelo}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <span
                            className={`inline-flex h-11 items-center rounded-2xl px-5 text-sm font-black ${getStatusClass(
                                equipo.estado
                            )}`}
                        >
                            {equipo.estado}
                        </span>

                        <Link
                            href={`/inventario/${equipo.id}/editar`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-white/20"
                        >
                            <Edit3 className="h-4 w-4" />
                            Editar equipo
                        </Link>

                        {!baja ? (
                            <button
                                type="button"
                                onClick={() => setShowBajaForm((current) => !current)}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-red-700"
                            >
                                <FileWarning className="h-4 w-4" />
                                Dar de baja
                            </button>
                        ) : null}

                        <button
                            type="button"
                            onClick={() => exportEquipmentLifeSheetPdf(equipo, mantenimientos, baja)}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#006b2e] shadow-lg transition hover:-translate-y-0.5"
                        >
                            <Download className="h-4 w-4" />
                            Exportar hoja de vida
                        </button>
                    </div>
                </div>
            </section>

            {baja ? (
                <section className="rounded-[1.7rem] border border-red-100 bg-red-50 p-5 text-red-800 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-red-700">
                                <AlertTriangle className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.24em] text-red-700">
                                    Baja registrada
                                </p>

                                <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">
                                    Este activo fue dado de baja el {formatDate(baja.fechaBaja)}
                                </h3>

                                <p className="mt-2 text-sm leading-6">
                                    {baja.motivoBaja}
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-2 text-sm lg:min-w-[280px]">
                            <p>
                                <strong>Responsable:</strong> {baja.responsableBaja}
                            </p>
                            <p>
                                <strong>Estado físico:</strong> {baja.estadoFisico}
                            </p>
                            <p>
                                <strong>Disposición final:</strong> {baja.disposicionFinal}
                            </p>
                        </div>
                    </div>
                </section>
            ) : null}

            {showBajaForm && !baja ? (
                <section
                    id="baja-equipo"
                    className="rounded-[1.7rem] border border-red-100 bg-white p-5 shadow-sm"
                >
                    <SectionHeader
                        icon={FileWarning}
                        eyebrow="Baja controlada"
                        title="Registrar baja del activo"
                    />

                    <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                        Esta acción marcará el equipo como <strong>Dado de baja</strong> y
                        dejará registro permanente en la hoja de vida. No se eliminará la
                        información del activo ni su historial técnico.
                    </div>

                    <form
                        onSubmit={bajaForm.handleSubmit(onSubmitBaja)}
                        className="grid gap-4"
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Fecha de baja" error={bajaForm.formState.errors.fechaBaja?.message}>
                                <input
                                    type="date"
                                    {...bajaForm.register("fechaBaja")}
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Responsable de la baja" error={bajaForm.formState.errors.responsableBaja?.message}>
                                <input
                                    {...bajaForm.register("responsableBaja")}
                                    placeholder="Nombre del responsable"
                                    className={inputClass}
                                />
                            </Field>

                            <Field label="Estado físico" error={bajaForm.formState.errors.estadoFisico?.message}>
                                <select {...bajaForm.register("estadoFisico")} className={inputClass}>
                                    {physicalStatuses.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Disposición final" error={bajaForm.formState.errors.disposicionFinal?.message}>
                                <select {...bajaForm.register("disposicionFinal")} className={inputClass}>
                                    {finalDispositions.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>

                        <Field label="Motivo de baja" error={bajaForm.formState.errors.motivoBaja?.message}>
                            <textarea
                                {...bajaForm.register("motivoBaja")}
                                rows={4}
                                placeholder="Describa el motivo técnico, administrativo u operativo por el cual se da de baja el activo..."
                                className={textareaClass}
                            />
                        </Field>

                        <Field label="Observaciones">
                            <textarea
                                {...bajaForm.register("observaciones")}
                                rows={3}
                                placeholder="Observaciones adicionales..."
                                className={textareaClass}
                            />
                        </Field>

                        {bajaMessage ? (
                            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                                {bajaMessage}
                            </div>
                        ) : null}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setShowBajaForm(false)}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                disabled={bajaForm.formState.isSubmitting}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:-translate-y-0.5 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Save className="h-4 w-4" />
                                Confirmar baja
                            </button>
                        </div>
                    </form>
                </section>
            ) : null}

            {bajaMessage && baja ? (
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                    {bajaMessage}
                </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard
                    icon={Computer}
                    title="Tipo de equipo"
                    value={equipo.tipoEquipo}
                    description="Clasificación del activo"
                />

                <InfoCard
                    icon={UserRound}
                    title="Funcionario asignado"
                    value={equipo.funcionarioAsignado}
                    description={equipo.dependencia}
                />

                <InfoCard
                    icon={CalendarDays}
                    title="Fecha de ingreso"
                    value={formatDate(equipo.fechaIngreso)}
                    description="Registro en inventario"
                />

                <InfoCard
                    icon={MapPin}
                    title="Ubicación física"
                    value={equipo.ubicacionFisica}
                    description="Ubicación institucional"
                />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader icon={ClipboardList} eyebrow="Identificación" title="Datos generales del activo" />

                    <div className="grid gap-3 md:grid-cols-2">
                        <DetailItem label="Código interno" value={equipo.codigoInterno} />
                        <DetailItem label="Serial" value={equipo.serial} />
                        <DetailItem label="Marca" value={equipo.marca} />
                        <DetailItem label="Modelo" value={equipo.modelo} />
                        <DetailItem label="Dependencia" value={equipo.dependencia} />
                        <DetailItem label="Estado" value={equipo.estado} />
                    </div>
                </article>

                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader icon={Cpu} eyebrow="Ficha técnica" title="Características del equipo" />

                    <div className="grid gap-3">
                        <DetailItem label="Procesador" value={equipo.procesador} />
                        <DetailItem label="Memoria RAM" value={equipo.memoriaRam} />
                        <DetailItem label="Almacenamiento" value={equipo.almacenamiento} />
                        <DetailItem label="Sistema operativo" value={equipo.sistemaOperativo} />
                    </div>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1fr]">
                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader icon={Network} eyebrow="Red y conectividad" title="Identificación en red" />

                    <div className="grid gap-3">
                        <DetailItem label="Dirección IP" value={equipo.direccionIp || "No registrada"} />
                        <DetailItem label="Dirección MAC" value={equipo.direccionMac || "No registrada"} />
                    </div>
                </article>

                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader icon={ShieldCheck} eyebrow="Observaciones" title="Información complementaria" />

                    <p className="min-h-[92px] rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        {equipo.observaciones || "Sin observaciones registradas."}
                    </p>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={Plus}
                        eyebrow="Nuevo registro"
                        title="Registrar mantenimiento"
                    />

                    {isEquipoDadoDeBaja ? (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-700">
                            Este equipo se encuentra dado de baja. Por trazabilidad, ya no se
                            permite registrar mantenimientos operativos sobre este activo.
                        </div>
                    ) : (
                        <form
                            onSubmit={maintenanceForm.handleSubmit(onSubmitMaintenance)}
                            className="grid gap-4"
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Tipo de mantenimiento" error={maintenanceForm.formState.errors.tipoMantenimiento?.message}>
                                    <select {...maintenanceForm.register("tipoMantenimiento")} className={inputClass}>
                                        {maintenanceTypes.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Fecha" error={maintenanceForm.formState.errors.fechaMantenimiento?.message}>
                                    <input
                                        type="date"
                                        {...maintenanceForm.register("fechaMantenimiento")}
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Técnico responsable" error={maintenanceForm.formState.errors.tecnicoResponsable?.message}>
                                    <input
                                        {...maintenanceForm.register("tecnicoResponsable")}
                                        placeholder="Nombre del técnico"
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Estado resultante" error={maintenanceForm.formState.errors.estadoResultante?.message}>
                                    <select {...maintenanceForm.register("estadoResultante")} className={inputClass}>
                                        {resultingStatuses.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Próxima revisión">
                                    <input
                                        type="date"
                                        {...maintenanceForm.register("proximaRevision")}
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Repuestos utilizados">
                                    <input
                                        {...maintenanceForm.register("repuestosUtilizados")}
                                        placeholder="Ninguno / SSD / RAM / Fuente..."
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Recibe mantenimiento">
                                    <input
                                        {...maintenanceForm.register("nombreRecibe")}
                                        placeholder="Nombre de quien recibe"
                                        className={inputClass}
                                    />
                                </Field>

                                <Field label="Documento recibe">
                                    <input
                                        {...maintenanceForm.register("documentoRecibe")}
                                        placeholder="Cedula o identificacion"
                                        className={inputClass}
                                    />
                                </Field>
                            </div>

                            <Field label="Diagnóstico" error={maintenanceForm.formState.errors.diagnostico?.message}>
                                <textarea
                                    {...maintenanceForm.register("diagnostico")}
                                    rows={3}
                                    placeholder="Describa el diagnóstico técnico identificado..."
                                    className={textareaClass}
                                />
                            </Field>

                            <Field label="Actividades realizadas" error={maintenanceForm.formState.errors.actividadesRealizadas?.message}>
                                <textarea
                                    {...maintenanceForm.register("actividadesRealizadas")}
                                    rows={4}
                                    placeholder="Describa las actividades ejecutadas durante el mantenimiento..."
                                    className={textareaClass}
                                />
                            </Field>

                            <Field label="Observaciones">
                                <textarea
                                    {...maintenanceForm.register("observaciones")}
                                    rows={3}
                                    placeholder="Observaciones adicionales..."
                                    className={textareaClass}
                                />
                            </Field>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Field label="Firma técnico">
                                    <SignatureImageInput
                                        value={maintenanceForm.watch("firmaTecnico")}
                                        onChange={(value) =>
                                            maintenanceForm.setValue("firmaTecnico", value, {
                                                shouldDirty: true,
                                            })
                                        }
                                        placeholder="Nombre/firma interna del técnico"
                                    />
                                </Field>

                                <Field label="Firma recibe">
                                    <SignatureImageInput
                                        value={maintenanceForm.watch("firmaRecibe")}
                                        onChange={(value) =>
                                            maintenanceForm.setValue("firmaRecibe", value, {
                                                shouldDirty: true,
                                            })
                                        }
                                        placeholder="Nombre/firma interna de quien recibe"
                                    />
                                </Field>
                            </div>

                            {maintenanceMessage ? (
                                <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                                    {maintenanceMessage}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={maintenanceForm.formState.isSubmitting}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Save className="h-4 w-4" />
                                Guardar mantenimiento
                            </button>
                        </form>
                    )}
                </article>

                <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={Wrench}
                        eyebrow="Historial técnico"
                        title="Mantenimientos registrados"
                    />

                    {isLoadingMaintenances ? (
                        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                            Cargando mantenimientos...
                        </div>
                    ) : mantenimientos.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                                <HardDrive className="h-5 w-5" />
                            </div>

                            <h3 className="text-sm font-black text-[#14233b]">
                                Sin mantenimientos registrados
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Registra el primer mantenimiento para iniciar la trazabilidad
                                técnica del activo.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {mantenimientos.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
                                >
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wide text-[#006b2e]">
                                                {item.tipoMantenimiento}
                                            </p>

                                            <h4 className="mt-1 text-base font-black text-[#14233b]">
                                                {formatDate(item.fechaMantenimiento)}
                                            </h4>

                                            <p className="mt-1 text-sm text-slate-500">
                                                Técnico: {item.tecnicoResponsable}
                                            </p>
                                        </div>

                                        <span className={`rounded-full px-3 py-1 text-[11px] font-black ${getStatusClass(item.estadoResultante)}`}>
                                            {item.estadoResultante}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <MiniDetail title="Diagnóstico" value={item.diagnostico} />
                                        <MiniDetail
                                            title="Actividades realizadas"
                                            value={item.actividadesRealizadas}
                                        />

                                        {item.repuestosUtilizados ? (
                                            <MiniDetail
                                                title="Repuestos utilizados"
                                                value={item.repuestosUtilizados}
                                            />
                                        ) : null}

                                        {item.proximaRevision ? (
                                            <MiniDetail
                                                title="Próxima revisión"
                                                value={formatDate(item.proximaRevision)}
                                            />
                                        ) : null}

                                        {item.observaciones ? (
                                            <MiniDetail title="Observaciones" value={item.observaciones} />
                                        ) : null}

                                        {item.fechaFirmaUtc ? (
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <SignaturePreview
                                                    title="Firma técnico"
                                                    value={item.firmaTecnico}
                                                    fallback={item.tecnicoResponsable}
                                                />
                                                <SignaturePreview
                                                    title="Firma recibe"
                                                    value={item.firmaRecibe}
                                                    fallback={item.nombreRecibe || "No registrado"}
                                                />
                                                {item.documentoRecibe ? (
                                                    <MiniDetail
                                                        title="Documento recibe"
                                                        value={item.documentoRecibe}
                                                    />
                                                ) : null}
                                                <MiniDetail
                                                    title="Validación"
                                                    value="Firmado electrónicamente para uso interno"
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>
        </div>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

const textareaClass =
    "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

function SectionHeader({
    icon: Icon,
    eyebrow,
    title,
}: {
    icon: ElementType;
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                    {eyebrow}
                </p>
                <h3 className="text-xl font-black tracking-[-0.03em] text-[#14233b]">
                    {title}
                </h3>
            </div>
        </div>
    );
}

function InfoCard({
    icon: Icon,
    title,
    value,
    description,
}: {
    icon: ElementType;
    title: string;
    value: string;
    description: string;
}) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>

            <p className="text-sm font-bold text-slate-500">{title}</p>
            <h3 className="mt-2 text-lg font-black tracking-[-0.03em] text-[#14233b]">
                {value}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{description}</p>
        </article>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                {label}
            </p>
            <p className="mt-2 text-sm font-black text-[#14233b]">{value}</p>
        </div>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                {label}
            </span>

            {children}

            {error ? (
                <span className="mt-2 block text-xs font-bold text-red-600">
                    {error}
                </span>
            ) : null}
        </label>
    );
}

function isSignatureImage(value?: string | null) {
    return Boolean(value?.startsWith("data:image/"));
}

function SignaturePreview({
    title,
    value,
    fallback,
}: {
    title: string;
    value?: string | null;
    fallback: string;
}) {
    const displayValue = value || fallback;

    return (
        <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                {title}
            </p>
            {isSignatureImage(displayValue) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={displayValue}
                    alt={title}
                    className="mt-2 max-h-20 max-w-full rounded-xl border border-slate-200 bg-white object-contain p-2"
                />
            ) : (
                <p className="mt-1 text-sm leading-6 text-slate-700">
                    {displayValue}
                </p>
            )}
        </div>
    );
}

function MiniDetail({ title, value }: { title: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                {title}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
        </div>
    );
}
