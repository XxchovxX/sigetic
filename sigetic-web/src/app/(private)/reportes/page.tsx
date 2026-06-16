"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, FileSpreadsheet, Printer, Wrench } from "lucide-react";
import {
    getEquipos,
    getMantenimientosByEquipoId,
    type Equipo,
    type MantenimientoEquipo,
} from "@/lib/api";
import {
    getImpresoras,
    getMantenimientosImpresora,
    type Impresora,
    type MantenimientoImpresora,
} from "@/lib/impresoras-api";
import {
    getConsumibles,
    getMovimientosConsumible,
    type Consumible,
    type MovimientoConsumible,
} from "@/lib/consumibles-api";
import { exportRowsToExcel } from "@/lib/excel-export";
import { exportInstitutionalReportPdf } from "@/lib/pdf-reporte";

type EquipoMantenimientoRow = {
    equipo: Equipo;
    mantenimiento: MantenimientoEquipo;
};

type ImpresoraMantenimientoRow = {
    impresora: Impresora;
    mantenimiento: MantenimientoImpresora;
};

type ConsumibleMovimientoRow = {
    consumible: Consumible;
    movimiento: MovimientoConsumible;
};

function currentMonth() {
    return new Date().toISOString().slice(0, 7);
}

function isInMonth(value: string, month: string) {
    return value.slice(0, 7) === month;
}

export default function ReportesPage() {
    const [month, setMonth] = useState(currentMonth());
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState("");

    const monthLabel = useMemo(() => month || currentMonth(), [month]);

    async function runExport(
        label: string,
        action: () => Promise<void>
    ) {
        try {
            setIsLoading(label);
            setMessage("");
            await action();
            setMessage(`${label} generado correctamente.`);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : `No fue posible generar ${label}.`
            );
        } finally {
            setIsLoading("");
        }
    }

    async function exportInventario() {
        const [equipos, impresoras] = await Promise.all([
            getEquipos(),
            getImpresoras(),
        ]);

        const rows = [
            ...equipos.map((equipo) => ({
                tipoRegistro: "Equipo TIC",
                codigoInterno: equipo.codigoInterno,
                tipo: equipo.tipoEquipo,
                marca: equipo.marca,
                modelo: equipo.modelo,
                serial: equipo.serial,
                dependencia: equipo.dependencia,
                funcionario: equipo.funcionarioAsignado,
                estado: equipo.estado,
                procesador: equipo.procesador,
                memoriaRam: equipo.memoriaRam,
                almacenamiento: equipo.almacenamiento,
                sistemaOperativo: equipo.sistemaOperativo,
                tecnologiaImpresion: "",
                ubicacionFisica: equipo.ubicacionFisica,
                direccionIp: equipo.direccionIp,
                direccionMac: equipo.direccionMac,
                fechaIngreso: equipo.fechaIngreso,
                observaciones: equipo.observaciones,
            })),
            ...impresoras.map((impresora) => ({
                tipoRegistro: "Impresora",
                codigoInterno: impresora.codigoInterno,
                tipo: impresora.tipoImpresora,
                marca: impresora.marca,
                modelo: impresora.modelo,
                serial: impresora.serial,
                dependencia: impresora.dependencia,
                funcionario: impresora.funcionarioAsignado ?? "",
                estado: impresora.estado,
                procesador: "",
                memoriaRam: "",
                almacenamiento: "",
                sistemaOperativo: "",
                tecnologiaImpresion: impresora.tecnologiaImpresion,
                ubicacionFisica: impresora.ubicacionFisica,
                direccionIp: impresora.direccionIp,
                direccionMac: impresora.direccionMac,
                fechaIngreso: impresora.fechaIngreso,
                observaciones: impresora.observaciones,
            })),
        ];

        exportRowsToExcel(
            `sigetic-activos-tecnologicos-${new Date().toISOString().slice(0, 10)}.xls`,
            "SIGETIC - Activos tecnológicos registrados y hojas de vida",
            [
                { header: "Tipo registro", value: (row) => row.tipoRegistro },
                { header: "Código interno", value: (row) => row.codigoInterno },
                { header: "Tipo", value: (row) => row.tipo },
                { header: "Marca", value: (row) => row.marca },
                { header: "Modelo", value: (row) => row.modelo },
                { header: "Serial", value: (row) => row.serial },
                { header: "Dependencia", value: (row) => row.dependencia },
                { header: "Funcionario", value: (row) => row.funcionario },
                { header: "Estado", value: (row) => row.estado },
                { header: "Procesador", value: (row) => row.procesador },
                { header: "Memoria RAM", value: (row) => row.memoriaRam },
                { header: "Almacenamiento", value: (row) => row.almacenamiento },
                { header: "Sistema operativo", value: (row) => row.sistemaOperativo },
                { header: "Tecnología impresión", value: (row) => row.tecnologiaImpresion },
                { header: "Ubicación física", value: (row) => row.ubicacionFisica },
                { header: "IP", value: (row) => row.direccionIp },
                { header: "MAC", value: (row) => row.direccionMac },
                { header: "Fecha ingreso", value: (row) => row.fechaIngreso },
                { header: "Observaciones", value: (row) => row.observaciones },
            ],
            rows
        );
    }

    async function exportInventarioPdf() {
        const [equipos, impresoras] = await Promise.all([
            getEquipos(),
            getImpresoras(),
        ]);

        const rows = [
            ...equipos.map((equipo) => ({
                tipoRegistro: "Equipo TIC",
                codigoInterno: equipo.codigoInterno,
                tipo: equipo.tipoEquipo,
                marca: equipo.marca,
                modelo: equipo.modelo,
                serial: equipo.serial,
                dependencia: equipo.dependencia,
                funcionario: equipo.funcionarioAsignado,
                estado: equipo.estado,
                fechaIngreso: equipo.fechaIngreso,
            })),
            ...impresoras.map((impresora) => ({
                tipoRegistro: "Impresora",
                codigoInterno: impresora.codigoInterno,
                tipo: impresora.tipoImpresora,
                marca: impresora.marca,
                modelo: impresora.modelo,
                serial: impresora.serial,
                dependencia: impresora.dependencia,
                funcionario: impresora.funcionarioAsignado ?? "",
                estado: impresora.estado,
                fechaIngreso: impresora.fechaIngreso,
            })),
        ];

        await exportInstitutionalReportPdf(
            {
                fileName: `sigetic-activos-tecnologicos-${new Date().toISOString().slice(0, 10)}.pdf`,
                title: "Activos tecnológicos registrados",
                code: "TIC-REP-ACT-01",
                subtitle: "Equipos TIC e impresoras registrados en SIGETIC con datos base de hoja de vida.",
                columns: [
                    { header: "Tipo", value: (row) => row.tipoRegistro, width: 28 },
                    { header: "Código", value: (row) => row.codigoInterno, width: 26 },
                    { header: "Activo", value: (row) => `${row.tipo} ${row.marca} ${row.modelo}`, width: 55 },
                    { header: "Serial", value: (row) => row.serial, width: 36 },
                    { header: "Dependencia", value: (row) => row.dependencia, width: 52 },
                    { header: "Funcionario", value: (row) => row.funcionario, width: 45 },
                    { header: "Estado", value: (row) => row.estado, width: 25 },
                ],
                rows,
            }
        );
    }

    async function exportEquiposAtendidos() {
        const equipos = await getEquipos();
        const rows: EquipoMantenimientoRow[] = [];

        await Promise.all(
            equipos.map(async (equipo) => {
                const mantenimientos = await getMantenimientosByEquipoId(equipo.id);
                mantenimientos
                    .filter((mantenimiento) =>
                        isInMonth(mantenimiento.fechaMantenimiento, monthLabel)
                    )
                    .forEach((mantenimiento) => rows.push({ equipo, mantenimiento }));
            })
        );

        exportRowsToExcel(
            `sigetic-equipos-atendidos-${monthLabel}.xls`,
            `SIGETIC - Equipos atendidos ${monthLabel}`,
            [
                { header: "Fecha", value: (row) => row.mantenimiento.fechaMantenimiento },
                { header: "Código equipo", value: (row) => row.equipo.codigoInterno },
                { header: "Tipo equipo", value: (row) => row.equipo.tipoEquipo },
                { header: "Marca", value: (row) => row.equipo.marca },
                { header: "Modelo", value: (row) => row.equipo.modelo },
                { header: "Serial", value: (row) => row.equipo.serial },
                { header: "Dependencia", value: (row) => row.equipo.dependencia },
                { header: "Funcionario", value: (row) => row.equipo.funcionarioAsignado },
                { header: "Tipo mantenimiento", value: (row) => row.mantenimiento.tipoMantenimiento },
                { header: "Técnico", value: (row) => row.mantenimiento.tecnicoResponsable },
                { header: "Diagnóstico", value: (row) => row.mantenimiento.diagnostico },
                { header: "Actividades", value: (row) => row.mantenimiento.actividadesRealizadas },
                { header: "Repuestos", value: (row) => row.mantenimiento.repuestosUtilizados },
                { header: "Estado resultante", value: (row) => row.mantenimiento.estadoResultante },
            ],
            rows
        );
    }

    async function exportEquiposAtendidosPdf() {
        const equipos = await getEquipos();
        const rows: EquipoMantenimientoRow[] = [];

        await Promise.all(
            equipos.map(async (equipo) => {
                const mantenimientos = await getMantenimientosByEquipoId(equipo.id);
                mantenimientos
                    .filter((mantenimiento) =>
                        isInMonth(mantenimiento.fechaMantenimiento, monthLabel)
                    )
                    .forEach((mantenimiento) => rows.push({ equipo, mantenimiento }));
            })
        );

        await exportInstitutionalReportPdf({
            fileName: `sigetic-equipos-atendidos-${monthLabel}.pdf`,
            title: `Equipos atendidos ${monthLabel}`,
            code: "TIC-REP-MEQ-01",
            subtitle: "Mantenimientos preventivos y correctivos registrados para equipos TIC.",
            columns: [
                { header: "Fecha", value: (row) => row.mantenimiento.fechaMantenimiento, width: 24 },
                { header: "Código", value: (row) => row.equipo.codigoInterno, width: 24 },
                { header: "Equipo", value: (row) => `${row.equipo.tipoEquipo} ${row.equipo.marca} ${row.equipo.modelo}`, width: 48 },
                { header: "Dependencia", value: (row) => row.equipo.dependencia, width: 40 },
                { header: "Tipo", value: (row) => row.mantenimiento.tipoMantenimiento, width: 28 },
                { header: "Técnico", value: (row) => row.mantenimiento.tecnicoResponsable, width: 38 },
                { header: "Actividades", value: (row) => row.mantenimiento.actividadesRealizadas, width: 68 },
            ],
            rows,
        });
    }

    async function exportImpresorasAtendidas() {
        const impresoras = await getImpresoras();
        const rows: ImpresoraMantenimientoRow[] = [];

        await Promise.all(
            impresoras.map(async (impresora) => {
                const mantenimientos = await getMantenimientosImpresora(impresora.id);
                mantenimientos
                    .filter((mantenimiento) =>
                        isInMonth(mantenimiento.fechaMantenimiento, monthLabel)
                    )
                    .forEach((mantenimiento) => rows.push({ impresora, mantenimiento }));
            })
        );

        exportRowsToExcel(
            `sigetic-impresoras-atendidas-${monthLabel}.xls`,
            `SIGETIC - Impresoras atendidas ${monthLabel}`,
            [
                { header: "Fecha", value: (row) => row.mantenimiento.fechaMantenimiento },
                { header: "Código impresora", value: (row) => row.impresora.codigoInterno },
                { header: "Marca", value: (row) => row.impresora.marca },
                { header: "Modelo", value: (row) => row.impresora.modelo },
                { header: "Serial", value: (row) => row.impresora.serial },
                { header: "Dependencia", value: (row) => row.impresora.dependencia },
                { header: "Tipo mantenimiento", value: (row) => row.mantenimiento.tipoMantenimiento },
                { header: "Técnico", value: (row) => row.mantenimiento.tecnicoResponsable },
                { header: "Diagnóstico", value: (row) => row.mantenimiento.diagnostico },
                { header: "Actividades", value: (row) => row.mantenimiento.actividadesRealizadas },
                { header: "Contador páginas", value: (row) => row.mantenimiento.contadorPaginas },
                { header: "Estado resultante", value: (row) => row.mantenimiento.estadoResultante },
            ],
            rows
        );
    }

    async function exportImpresorasAtendidasPdf() {
        const impresoras = await getImpresoras();
        const rows: ImpresoraMantenimientoRow[] = [];

        await Promise.all(
            impresoras.map(async (impresora) => {
                const mantenimientos = await getMantenimientosImpresora(impresora.id);
                mantenimientos
                    .filter((mantenimiento) =>
                        isInMonth(mantenimiento.fechaMantenimiento, monthLabel)
                    )
                    .forEach((mantenimiento) => rows.push({ impresora, mantenimiento }));
            })
        );

        await exportInstitutionalReportPdf({
            fileName: `sigetic-impresoras-atendidas-${monthLabel}.pdf`,
            title: `Impresoras atendidas ${monthLabel}`,
            code: "TIC-REP-MIM-01",
            subtitle: "Mantenimientos de impresoras con contador de páginas cuando aplica.",
            columns: [
                { header: "Fecha", value: (row) => row.mantenimiento.fechaMantenimiento, width: 24 },
                { header: "Código", value: (row) => row.impresora.codigoInterno, width: 24 },
                { header: "Impresora", value: (row) => `${row.impresora.marca} ${row.impresora.modelo}`, width: 42 },
                { header: "Dependencia", value: (row) => row.impresora.dependencia, width: 40 },
                { header: "Tipo", value: (row) => row.mantenimiento.tipoMantenimiento, width: 28 },
                { header: "Contador páginas", value: (row) => row.mantenimiento.contadorPaginas, width: 30 },
                { header: "Actividades", value: (row) => row.mantenimiento.actividadesRealizadas, width: 76 },
            ],
            rows,
        });
    }

    async function exportConsumiblesEjecutados() {
        const consumibles = await getConsumibles();
        const rows: ConsumibleMovimientoRow[] = [];

        await Promise.all(
            consumibles.map(async (consumible) => {
                const movimientos = await getMovimientosConsumible(consumible.id);
                movimientos
                    .filter((movimiento) =>
                        isInMonth(movimiento.fechaMovimiento, monthLabel)
                    )
                    .forEach((movimiento) => rows.push({ consumible, movimiento }));
            })
        );

        exportRowsToExcel(
            `sigetic-consumibles-ejecutados-${monthLabel}.xls`,
            `SIGETIC - Consumibles ejecutados ${monthLabel}`,
            [
                { header: "Fecha", value: (row) => row.movimiento.fechaMovimiento },
                { header: "Código consumible", value: (row) => row.consumible.codigoInterno },
                { header: "Nombre", value: (row) => row.consumible.nombre },
                { header: "Tipo consumible", value: (row) => row.consumible.tipoConsumible },
                { header: "Referencia", value: (row) => row.consumible.referencia },
                { header: "Color", value: (row) => row.consumible.color },
                { header: "Tipo movimiento", value: (row) => row.movimiento.tipoMovimiento },
                { header: "Cantidad", value: (row) => row.movimiento.cantidad },
                { header: "Responsable", value: (row) => row.movimiento.responsable },
                { header: "Destino", value: (row) => row.movimiento.destino },
                { header: "Dependencia", value: (row) => row.movimiento.dependencia },
                { header: "Impresora", value: (row) => row.movimiento.impresora },
                { header: "Documento soporte", value: (row) => row.movimiento.documentoSoporte },
                { header: "Stock resultante", value: (row) => row.movimiento.stockResultante },
                { header: "Observaciones", value: (row) => row.movimiento.observaciones },
            ],
            rows
        );
    }

    async function exportConsumiblesEjecutadosPdf() {
        const consumibles = await getConsumibles();
        const rows: ConsumibleMovimientoRow[] = [];

        await Promise.all(
            consumibles.map(async (consumible) => {
                const movimientos = await getMovimientosConsumible(consumible.id);
                movimientos
                    .filter((movimiento) =>
                        isInMonth(movimiento.fechaMovimiento, monthLabel)
                    )
                    .forEach((movimiento) => rows.push({ consumible, movimiento }));
            })
        );

        await exportInstitutionalReportPdf({
            fileName: `sigetic-consumibles-ejecutados-${monthLabel}.pdf`,
            title: `Consumibles ejecutados ${monthLabel}`,
            code: "TIC-REP-CON-01",
            subtitle: "Movimientos de tintas, tóner y consumibles ejecutados en el periodo.",
            columns: [
                { header: "Fecha", value: (row) => row.movimiento.fechaMovimiento, width: 24 },
                { header: "Código", value: (row) => row.consumible.codigoInterno, width: 24 },
                { header: "Consumible", value: (row) => `${row.consumible.nombre} ${row.consumible.referencia}`, width: 52 },
                { header: "Color", value: (row) => row.consumible.color, width: 24 },
                { header: "Mov.", value: (row) => row.movimiento.tipoMovimiento, width: 24 },
                { header: "Cant.", value: (row) => row.movimiento.cantidad, width: 18 },
                { header: "Responsable", value: (row) => row.movimiento.responsable, width: 42 },
                { header: "Destino", value: (row) => row.movimiento.impresora ?? row.movimiento.dependencia ?? row.movimiento.destino, width: 58 },
            ],
            rows,
        });
    }

    async function exportMantenimientosConsolidados() {
        await exportEquiposAtendidos();
        await exportImpresorasAtendidas();
    }

    async function exportMantenimientosConsolidadosPdf() {
        await exportEquiposAtendidosPdf();
        await exportImpresorasAtendidasPdf();
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-gradient-to-r from-[#006b2e] via-[#0b8f3a] to-[#13a34a] p-6 text-white shadow-xl shadow-green-900/20">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-yellow-300">
                    Informes institucionales
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.05em]">
                    Reportes y exportaciones
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/85">
                    Genera archivos Excel para activos tecnológicos registrados,
                    equipos atendidos, impresoras atendidas, consumibles ejecutados
                    y mantenimientos.
                </p>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[260px_1fr] md:items-end">
                    <label className="block">
                        <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-600">
                            Mes del informe
                        </span>
                        <input
                            type="month"
                            value={month}
                            onChange={(event) => setMonth(event.target.value)}
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#0b8f3a] focus:ring-4 focus:ring-green-700/10"
                        />
                    </label>

                    {message ? (
                        <div className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-[#006b2e]">
                            {message}
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <ReportCard
                    title="Activos tecnológicos registrados"
                    description="Exporta los equipos TIC e impresoras registrados con datos de hoja de vida."
                    icon={FileSpreadsheet}
                    loading={isLoading}
                    onClick={() => runExport("Activos tecnológicos registrados", exportInventario)}
                    onPdf={() => runExport("PDF activos tecnológicos registrados", exportInventarioPdf)}
                />
                <ReportCard
                    title="Equipos atendidos"
                    description="Informe mensual de mantenimientos o atenciones sobre equipos."
                    icon={Wrench}
                    loading={isLoading}
                    onClick={() => runExport("Equipos atendidos", exportEquiposAtendidos)}
                    onPdf={() => runExport("PDF equipos atendidos", exportEquiposAtendidosPdf)}
                />
                <ReportCard
                    title="Impresoras atendidas"
                    description="Informe mensual de mantenimientos realizados a impresoras."
                    icon={Printer}
                    loading={isLoading}
                    onClick={() => runExport("Impresoras atendidas", exportImpresorasAtendidas)}
                    onPdf={() => runExport("PDF impresoras atendidas", exportImpresorasAtendidasPdf)}
                />
                <ReportCard
                    title="Consumibles ejecutados"
                    description="Informe mensual de tintas, tóner y consumibles con movimientos."
                    icon={FileSpreadsheet}
                    loading={isLoading}
                    onClick={() => runExport("Consumibles ejecutados", exportConsumiblesEjecutados)}
                    onPdf={() => runExport("PDF consumibles ejecutados", exportConsumiblesEjecutadosPdf)}
                />
                <ReportCard
                    title="Mantenimientos"
                    description="Genera reportes de preventivos y correctivos en equipos e impresoras."
                    icon={BarChart3}
                    loading={isLoading}
                    onClick={() => runExport("Mantenimientos", exportMantenimientosConsolidados)}
                    onPdf={() => runExport("PDF mantenimientos", exportMantenimientosConsolidadosPdf)}
                />
            </section>
        </div>
    );
}

function ReportCard({
    title,
    description,
    icon: Icon,
    loading,
    onClick,
    onPdf,
}: {
    title: string;
    description: string;
    icon: React.ElementType;
    loading: string;
    onClick: () => void;
    onPdf: () => void;
}) {
    return (
        <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#006b2e]">
                <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black tracking-[-0.03em] text-[#14233b]">
                {title}
            </h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {description}
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                    type="button"
                    onClick={onClick}
                    disabled={Boolean(loading)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#006b2e] to-[#0b8f3a] px-4 text-sm font-black text-white shadow-lg shadow-green-900/20 disabled:opacity-70"
                >
                    <Download className="h-4 w-4" />
                    {loading === title ? "Generando..." : "Excel"}
                </button>
                <button
                    type="button"
                    onClick={onPdf}
                    disabled={Boolean(loading)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#006b2e] bg-white px-4 text-sm font-black text-[#006b2e] disabled:opacity-70"
                >
                    <FileSpreadsheet className="h-4 w-4" />
                    {loading === `PDF ${title.toLowerCase()}` ? "Generando..." : "PDF"}
                </button>
            </div>
        </article>
    );
}
