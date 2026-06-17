"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    Computer,
    HardDrive,
    Save,
    UserRound,
} from "lucide-react";
import { z } from "zod";
import { createEquipo } from "@/lib/api";

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

const dependencies = [
    "Despacho Municipal",
    "Secretaria de Planeacion",
    "Secretaria de Gobierno",
    "Secretaria Administrativa y Financiera",
    "Control Interno",
    "Juridica",
    "Comisaria de Familia",
    "Inspeccion de Policia",
    "Almacen",
    "Sistemas",
];

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

export default function NewEquipmentPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                    <SectionHeader
                        icon={Computer}
                        title="Informacion general del activo"
                        description="Datos de identificacion, clasificacion y estado inicial."
                    />

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Codigo interno" error={errors.codigoInterno?.message}>
                            <input
                                {...register("codigoInterno")}
                                placeholder="Ej: TIC-PLA-001"
                                className={inputClass}
                            />
                        </Field>

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

                    <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Dependencia" error={errors.dependencia?.message}>
                            <select {...register("dependencia")} className={inputClass}>
                                <option value="">Seleccione...</option>
                                {dependencies.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
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
                                disabled={isSubmitting}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-5 text-sm font-black text-white shadow-lg shadow-green-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? "Guardando..." : "Guardar equipo"}
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
