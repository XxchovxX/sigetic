"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowLeft,
    AlertTriangle,
    CheckCircle2,
    ClipboardList,
    Computer,
    Copy,
    Download,
    ExternalLink,
    HardDrive,
    Laptop,
    Loader2,
    Save,
    ScanLine,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { z } from "zod";
import { createEquipo, getCodigoEquipoSugerido } from "@/lib/api";
import { getPerfilDependencias, type PerfilDependencia } from "@/lib/auth";
import {
    crearInventarioDeteccion,
    descargarRecolectorWindows,
    getEstadoInventarioDeteccion,
    type DatosInventarioDetectados,
    type InventarioDeteccionCreada,
} from "@/lib/inventario-deteccion-api";

const equipmentSchema = z.object({
    codigoInterno: z.string().min(3, "El codigo interno es obligatorio."),
    tipoEquipo: z.string().min(1, "Seleccione el tipo de equipo."),
    marca: z.string().min(2, "La marca es obligatoria."),
    modelo: z.string().min(2, "El modelo es obligatorio."),
    serial: z.string().min(3, "El serial es obligatorio."),
    dependencia: z.string().min(1, "Seleccione la dependencia."),
    funcionarioAsignado: z.string().min(2, "El funcionario asignado es obligatorio."),
    estado: z.string().min(1, "Seleccione el estado."),
    procesador: z.string().min(2, "El procesador es obligatorio."),
    memoriaRam: z.string().min(1, "Ingrese la memoria RAM."),
    almacenamiento: z.string().min(1, "Ingrese el almacenamiento."),
    sistemaOperativo: z.string().min(2, "El sistema operativo es obligatorio."),
    direccionIp: z.string().optional(),
    direccionMac: z.string().optional(),
    ubicacionFisica: z.string().min(2, "La ubicacion fisica es obligatoria."),
    fechaIngreso: z.string().min(1, "La fecha de ingreso es obligatoria."),
    observaciones: z.string().optional(),
});

type EquipmentFormValues = z.infer<typeof equipmentSchema>;

type DetectionState =
    | "idle"
    | "creating"
    | "waiting"
    | "received"
    | "duplicate"
    | "expired"
    | "error";

const equipmentTypes = [
    "Computador de escritorio",
    "Portatil",
    "Servidor",
    "Monitor",
    "Switch",
    "Router",
    "Access Point",
    "UPS",
    "Otro",
];

const statuses = [
    "Activo",
    "En mantenimiento",
    "Disponible",
    "Dado de baja",
    "Pendiente de revision",
    "Pendiente de repuesto",
];

function today() {
    return new Date().toISOString().slice(0, 10);
}

function getCollectorCommand(fileName: string) {
    return `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$HOME\\Downloads\\${fileName}"`;
}

function formatStorage(data: DatosInventarioDetectados) {
    const storage = (data.discos ?? [])
        .filter((disk) => disk.capacidadBytes > 0)
        .map((disk) => {
            const capacity = Math.round((disk.capacidadBytes / 1_000_000_000) * 10) / 10;
            return `${disk.tipo || "Disco"} ${capacity} GB${disk.modelo ? ` (${disk.modelo})` : ""}`;
        })
        .join(" | ");

    return storage.slice(0, 120) || "No identificado";
}

function buildDetectionNotes(data: DatosInventarioDetectados) {
    return [
        "Captura automática SIGETIC",
        data.nombreEquipo ? `Nombre del equipo: ${data.nombreEquipo}` : "",
        data.uuidHardware ? `UUID: ${data.uuidHardware}` : "",
        data.biosVersion ? `BIOS: ${data.biosVersion}` : "",
        data.usuarioActual ? `Usuario de Windows: ${data.usuarioActual}` : "",
        data.fechaInstalacion ? `Instalación del sistema: ${data.fechaInstalacion}` : "",
    ]
        .filter(Boolean)
        .join(" | ");
}

export default function NewEquipmentPage() {
    const router = useRouter();
    const [detectionSession, setDetectionSession] = useState<InventarioDeteccionCreada | null>(null);
    const [detectionState, setDetectionState] = useState<DetectionState>("idle");
    const [detectionError, setDetectionError] = useState("");
    const [existingEquipmentId, setExistingEquipmentId] = useState<string | null>(null);
    const [commandCopied, setCommandCopied] = useState(false);
    const [collectorFileName, setCollectorFileName] = useState("");
    const [dependencies, setDependencies] = useState<PerfilDependencia[]>([]);
    const [dependenciesError, setDependenciesError] = useState("");
    const [isCodeLoading, setIsCodeLoading] = useState(false);
    const [codeError, setCodeError] = useState("");

    const {
        register,
        control,
        handleSubmit,
        getValues,
        reset,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<EquipmentFormValues>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            codigoInterno: "",
            tipoEquipo: "Computador de escritorio",
            marca: "",
            modelo: "",
            serial: "",
            dependencia: "",
            funcionarioAsignado: "",
            estado: "Activo",
            procesador: "",
            memoriaRam: "",
            almacenamiento: "",
            sistemaOperativo: "",
            direccionIp: "",
            direccionMac: "",
            ubicacionFisica: "",
            fechaIngreso: today(),
            observaciones: "",
        },
    });
    const [selectedEquipmentType, selectedDependency] = useWatch({
        control,
        name: ["tipoEquipo", "dependencia"],
    });

    useEffect(() => {
        let cancelled = false;

        getPerfilDependencias()
            .then((items) => {
                if (cancelled) return;
                setDependencies(items);
                setDependenciesError("");
            })
            .catch((error) => {
                if (cancelled) return;
                setDependenciesError(
                    error instanceof Error
                        ? error.message
                        : "No fue posible cargar las dependencias."
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        if (!selectedEquipmentType || !selectedDependency) {
            setValue("codigoInterno", "");
            setCodeError("");
            setIsCodeLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setValue("codigoInterno", "");
        setIsCodeLoading(true);
        setCodeError("");

        getCodigoEquipoSugerido(selectedEquipmentType, selectedDependency)
            .then((suggestion) => {
                if (cancelled) return;
                setValue("codigoInterno", suggestion.codigo, {
                    shouldDirty: true,
                    shouldValidate: true,
                });
            })
            .catch((error) => {
                if (cancelled) return;
                setValue("codigoInterno", "");
                setCodeError(
                    error instanceof Error
                        ? error.message
                        : "No fue posible generar el código."
                );
            })
            .finally(() => {
                if (!cancelled) setIsCodeLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedDependency, selectedEquipmentType, setValue]);

    const applyDetectedData = useCallback((data: DatosInventarioDetectados) => {
        const current = getValues();
        const operatingSystem = [
            data.sistemaOperativo,
            data.versionSistemaOperativo,
            data.arquitectura,
        ].filter(Boolean).join(" · ").slice(0, 120);
        const notes = [current.observaciones, buildDetectionNotes(data)]
            .filter(Boolean)
            .join("\n")
            .slice(0, 1000);

        reset({
            ...current,
            tipoEquipo: equipmentTypes.includes(data.tipoEquipo ?? "")
                ? (data.tipoEquipo ?? current.tipoEquipo)
                : current.tipoEquipo,
            marca: data.fabricante || current.marca,
            modelo: data.modelo || current.modelo,
            serial: data.serial || current.serial,
            procesador: data.procesador || current.procesador,
            memoriaRam: data.memoriaRamGb > 0
                ? `${data.memoriaRamGb} GB`
                : current.memoriaRam,
            almacenamiento: formatStorage(data),
            sistemaOperativo: operatingSystem || current.sistemaOperativo,
            direccionIp: data.direccionIp || current.direccionIp,
            direccionMac: data.direccionMac || current.direccionMac,
            observaciones: notes,
        });
    }, [getValues, reset]);

    useEffect(() => {
        if (!detectionSession || detectionState !== "waiting") return;

        let cancelled = false;
        let timer: number | undefined;
        const sessionId = detectionSession.id;

        async function pollDetection() {
            try {
                const status = await getEstadoInventarioDeteccion(sessionId);
                if (cancelled) return;

                if (status.estado === "Expirada") {
                    setDetectionState("expired");
                    return;
                }

                if (status.estado === "Recibida" && status.datos) {
                    if (status.equipoExistenteId) {
                        setExistingEquipmentId(status.equipoExistenteId);
                        setDetectionState("duplicate");
                    } else {
                        applyDetectedData(status.datos);
                        setDetectionState("received");
                    }
                    return;
                }

                timer = window.setTimeout(() => void pollDetection(), 2500);
            } catch (error) {
                if (cancelled) return;
                setDetectionError(
                    error instanceof Error
                        ? error.message
                        : "No fue posible consultar la detección."
                );
                setDetectionState("error");
            }
        }

        timer = window.setTimeout(() => void pollDetection(), 1200);

        return () => {
            cancelled = true;
            if (timer) window.clearTimeout(timer);
        };
    }, [applyDetectedData, detectionSession, detectionState]);

    async function startDetection() {
        try {
            setDetectionState("creating");
            setDetectionError("");
            setExistingEquipmentId(null);
            setCommandCopied(false);

            const session = await crearInventarioDeteccion();
            setDetectionSession(session);
            const fileName = await descargarRecolectorWindows(
                session.token,
                window.location.origin,
                session.id
            );
            setCollectorFileName(fileName);
            setDetectionState("waiting");
        } catch (error) {
            setDetectionError(
                error instanceof Error
                    ? error.message
                    : "No fue posible iniciar la detección."
            );
            setDetectionState("error");
        }
    }

    async function downloadCollectorAgain() {
        if (!detectionSession) return;

        try {
            await descargarRecolectorWindows(
                detectionSession.token,
                window.location.origin,
                detectionSession.id
            );
        } catch (error) {
            setDetectionError(
                error instanceof Error
                    ? error.message
                    : "No fue posible descargar nuevamente el recolector."
            );
        }
    }

    async function copyCollectorCommand() {
        await navigator.clipboard.writeText(getCollectorCommand(collectorFileName));
        setCommandCopied(true);
        window.setTimeout(() => setCommandCopied(false), 1800);
    }

    async function onSubmit(data: EquipmentFormValues) {
        const created = await createEquipo({
            codigoInterno: data.codigoInterno,
            tipoEquipo: data.tipoEquipo,
            marca: data.marca,
            modelo: data.modelo,
            serial: data.serial,
            dependencia: data.dependencia,
            funcionarioAsignado: data.funcionarioAsignado,
            estado: data.estado,
            procesador: data.procesador,
            memoriaRam: data.memoriaRam,
            almacenamiento: data.almacenamiento,
            sistemaOperativo: data.sistemaOperativo,
            direccionIp: data.direccionIp || null,
            direccionMac: data.direccionMac || null,
            ubicacionFisica: data.ubicacionFisica,
            fechaIngreso: data.fechaIngreso,
            observaciones: data.observaciones || null,
            generarCodigoAutomatico: true,
        });

        router.push(`/inventario/${created.id}`);
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <Link
                        href="/inventario"
                        className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#006b2e] transition hover:text-[#0b8f3a]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inventario
                    </Link>

                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[#006b2e]">
                        Nuevo activo tecnologico
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-[#14233b]">
                        Registrar equipo TIC
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                        Ingresa la informacion tecnica, administrativa y de asignacion
                        para crear la hoja de vida del activo.
                    </p>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                    <CheckCircle2 className="h-5 w-5" />
                    Registro controlado
                </div>
            </section>

            <section className="overflow-hidden rounded-[1.7rem] border border-green-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                            <ScanLine className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#006b2e]">
                                Detección automática
                            </p>
                            <h3 className="mt-1 text-lg font-black text-[#14233b]">
                                Obtener datos de este PC con Windows
                            </h3>
                            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                Descarga y ejecuta el recolector temporal. El formulario se completará cuando SIGETIC reciba el inventario técnico.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
                                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-[#006b2e]" />Sin contraseñas</span>
                                <span className="inline-flex items-center gap-1.5"><Laptop className="h-4 w-4 text-[#006b2e]" />Windows 10 y 11</span>
                                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#006b2e]" />Código de un solo uso</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void startDetection()}
                        disabled={detectionState === "creating" || detectionState === "waiting"}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#006b2e] px-5 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-[#0b8f3a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {detectionState === "creating" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {detectionState === "creating" ? "Preparando..." : "Detectar este equipo"}
                    </button>
                </div>

                {detectionState === "waiting" ? (
                    <div className="border-t border-green-100 bg-green-50/60 px-5 py-4">
                        <div className="flex items-start gap-3">
                            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#006b2e]" />
                            <div className="min-w-0 flex-1">
                                <p className="font-black text-[#14233b]">Esperando los datos del computador</p>
                                <p className="mt-1 text-sm text-slate-600">Abre PowerShell y ejecuta el siguiente comando. Esta pantalla se actualizará automáticamente.</p>
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                    <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-[#14233b] px-4 py-3 text-xs text-white">{getCollectorCommand(collectorFileName)}</code>
                                    <button type="button" onClick={() => void copyCollectorCommand()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-xs font-black text-[#006b2e] hover:bg-green-50">
                                        <Copy className="h-4 w-4" />{commandCopied ? "Copiado" : "Copiar"}
                                    </button>
                                    <button type="button" onClick={() => void downloadCollectorAgain()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 text-xs font-black text-[#006b2e] hover:bg-green-50">
                                        <Download className="h-4 w-4" />Descargar otra vez
                                    </button>
                                </div>
                                <p className="mt-2 text-xs font-bold text-slate-500">La vinculación vence a las {detectionSession ? new Date(detectionSession.expiraUtc).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : ""}.</p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {detectionState === "received" ? (
                    <div className="flex items-start gap-3 border-t border-green-100 bg-green-50 px-5 py-4 text-sm text-[#006b2e]">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        <div><p className="font-black">Datos técnicos recibidos y cargados</p><p className="mt-1 text-slate-600">Revisa los campos, completa ubicación, dependencia y funcionario. SIGETIC asignará el código interno.</p></div>
                    </div>
                ) : null}

                {detectionState === "duplicate" && existingEquipmentId ? (
                    <div className="flex flex-col gap-3 border-t border-yellow-200 bg-yellow-50 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" /><div><p className="font-black text-[#14233b]">Este serial ya está registrado</p><p className="mt-1 text-slate-600">No se cargaron los datos para evitar crear una ficha duplicada.</p></div></div>
                        <Link href={`/inventario/${existingEquipmentId}`} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-yellow-300 bg-white px-4 text-xs font-black text-yellow-800 hover:bg-yellow-100"><ExternalLink className="h-4 w-4" />Ver equipo existente</Link>
                    </div>
                ) : null}

                {detectionState === "expired" ? (
                    <div className="flex items-start gap-3 border-t border-yellow-200 bg-yellow-50 px-5 py-4 text-sm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" /><div><p className="font-black text-[#14233b]">La detección venció</p><p className="mt-1 text-slate-600">Pulsa Detectar este equipo para generar un recolector nuevo.</p></div></div>
                ) : null}

                {detectionState === "error" || detectionError ? (
                    <div role="alert" className="flex items-start gap-3 border-t border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-black">No se completó la detección</p><p className="mt-1">{detectionError}</p></div></div>
                ) : null}
            </section>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={Computer}
                        title="Informacion general del activo"
                        description="Datos de identificacion, clasificacion y estado inicial."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Tipo de equipo" error={errors.tipoEquipo?.message}>
                            <select {...register("tipoEquipo")} className={inputClass}>
                                {equipmentTypes.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Marca" error={errors.marca?.message}>
                            <input
                                {...register("marca")}
                                placeholder="Ej: Dell, HP, Lenovo"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Modelo" error={errors.modelo?.message}>
                            <input
                                {...register("modelo")}
                                placeholder="Ej: ProDesk 400"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Serial" error={errors.serial?.message}>
                            <input
                                {...register("serial")}
                                placeholder="Serial de fabrica"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Estado" error={errors.estado?.message}>
                            <select {...register("estado")} className={inputClass}>
                                {statuses.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Fecha de ingreso" error={errors.fechaIngreso?.message}>
                            <input
                                type="date"
                                {...register("fechaIngreso")}
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Ubicacion fisica" error={errors.ubicacionFisica?.message}>
                            <input
                                {...register("ubicacionFisica")}
                                placeholder="Ej: Planeacion, primer piso"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </section>

                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={HardDrive}
                        title="Caracteristicas tecnicas"
                        description="Base tecnica para soporte, mantenimiento y hoja de vida."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Procesador" error={errors.procesador?.message}>
                            <input
                                {...register("procesador")}
                                placeholder="Ej: Intel Core i5"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Memoria RAM" error={errors.memoriaRam?.message}>
                            <input
                                {...register("memoriaRam")}
                                placeholder="Ej: 8 GB"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Almacenamiento" error={errors.almacenamiento?.message}>
                            <input
                                {...register("almacenamiento")}
                                placeholder="Ej: SSD 512 GB"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Sistema operativo" error={errors.sistemaOperativo?.message}>
                            <input
                                {...register("sistemaOperativo")}
                                placeholder="Ej: Windows 11 Pro"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Direccion IP">
                            <input
                                {...register("direccionIp")}
                                placeholder="Ej: 192.168.1.50"
                                className={inputClass}
                            />
                        </Field>

                        <Field label="Direccion MAC">
                            <input
                                {...register("direccionMac")}
                                placeholder="Ej: AA-BB-CC-00-11-22"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </section>

                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={UserRound}
                        title="Asignacion administrativa"
                        description="Dependencia y funcionario responsable del activo."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Field label="Dependencia" error={errors.dependencia?.message}>
                            <select {...register("dependencia")} className={inputClass}>
                                <option value="">Seleccione...</option>
                                {dependencies.map((item) => (
                                    <option key={item.id} value={item.nombre}>
                                        {item.nombre} ({item.codigo})
                                    </option>
                                ))}
                            </select>
                            {dependenciesError ? (
                                <span className="mt-2 block text-xs font-bold text-red-600">
                                    {dependenciesError}
                                </span>
                            ) : null}
                        </Field>

                        <Field label="Código interno automático" error={errors.codigoInterno?.message || codeError}>
                            <div className="relative">
                                <input
                                    {...register("codigoInterno")}
                                    readOnly
                                    aria-readonly="true"
                                    placeholder="Selecciona una dependencia"
                                    className={`${inputClass} bg-slate-50 pr-11 font-bold text-[#14233b]`}
                                />
                                {isCodeLoading ? (
                                    <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#006b2e]" />
                                ) : null}
                            </div>
                            <span className="mt-2 block text-xs text-slate-500">
                                El consecutivo definitivo se confirma al guardar.
                            </span>
                        </Field>

                        <Field
                            label="Funcionario asignado"
                            error={errors.funcionarioAsignado?.message}
                        >
                            <input
                                {...register("funcionarioAsignado")}
                                placeholder="Nombre del funcionario"
                                className={inputClass}
                            />
                        </Field>
                    </div>
                </section>

                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={ClipboardList}
                        title="Observaciones"
                        description="Informacion adicional para soporte, entrega o seguimiento."
                    />

                    <textarea
                        {...register("observaciones")}
                        rows={5}
                        placeholder="Observaciones tecnicas o administrativas..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                    />
                </section>

                <section className="sticky bottom-0 z-10 rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-slate-900/10 backdrop-blur">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                            Al guardar se creara la ficha del activo y quedara disponible
                            para mantenimientos, reportes y hoja de vida.
                        </p>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/inventario"
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                            >
                                Cancelar
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting || isCodeLoading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? "Guardando..." : isCodeLoading ? "Generando código..." : "Guardar equipo"}
                            </button>
                        </div>
                    </div>
                </section>
            </form>
        </div>
    );
}

const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10";

function SectionHeader({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
}) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>

            <div>
                <h3 className="text-lg font-black text-[#14233b]">{title}</h3>
                <p className="text-sm text-slate-500">{description}</p>
            </div>
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
    children: React.ReactNode;
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
