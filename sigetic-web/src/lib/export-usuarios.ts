import type { Usuario } from "@/lib/administracion-api";
import { exportRowsToExcel } from "@/lib/excel-export";
import { exportInstitutionalReportPdf } from "@/lib/pdf-reporte";

export function formatUserDate(value?: string | null) {
    return value ? new Date(value).toLocaleDateString("es-CO", { timeZone: "America/Bogota" }) : "Sin ingreso";
}

export function exportUsuariosExcel(usuarios: Usuario[]) {
    exportRowsToExcel("usuarios-sigetic.xls", "Usuarios registrados en SIGETIC", [
        { header: "Nombre completo", value: (u: Usuario) => u.nombreCompleto },
        { header: "Correo", value: (u: Usuario) => u.correo },
        { header: "Rol", value: (u: Usuario) => u.rol },
        { header: "Dependencia actual", value: (u: Usuario) => u.dependencia },
        { header: "Cargo actual", value: (u: Usuario) => u.cargo },
        { header: "Vinculación", value: (u: Usuario) => u.tipoVinculacion },
        { header: "Estado", value: (u: Usuario) => u.activo ? "Activo" : "Inactivo" },
        { header: "Acceso", value: (u: Usuario) => u.esCuentaGoogle ? "Google" : "Institucional" },
        { header: "Fecha de registro", value: (u: Usuario) => formatUserDate(u.fechaCreacionUtc) },
        { header: "Último ingreso", value: (u: Usuario) => formatUserDate(u.ultimoAccesoUtc) },
    ], usuarios);
}

export async function exportUsuariosPdf(usuarios: Usuario[]) {
    await exportInstitutionalReportPdf({
        fileName: "usuarios-sigetic.pdf",
        title: "Usuarios registrados en SIGETIC",
        code: "SIGETIC-USUARIOS",
        subtitle: `${usuarios.length} usuarios | Fecha de corte: ${formatUserDate(new Date().toISOString())}`,
        maxCellLines: 0,
        rows: usuarios,
        columns: [
            { header: "Nombre / Correo", width: 66, value: (u: Usuario) => `${u.nombreCompleto}\n${u.correo}` },
            { header: "Rol / Vinculación", width: 42, value: (u: Usuario) => `${u.rol}\n${u.tipoVinculacion || "Sin vinculación"}` },
            { header: "Dependencia / Cargo", width: 60, value: (u: Usuario) => `${u.dependencia || "Sin dependencia"}\n${u.cargo || "Sin cargo"}` },
            { header: "Estado / Acceso", width: 28, value: (u: Usuario) => `${u.activo ? "Activo" : "Inactivo"}\n${u.esCuentaGoogle ? "Google" : "Institucional"}` },
            { header: "Registro", width: 27, value: (u: Usuario) => formatUserDate(u.fechaCreacionUtc) },
            { header: "Último ingreso", width: 28, value: (u: Usuario) => formatUserDate(u.ultimoAccesoUtc) },
        ],
    });
}
