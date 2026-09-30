import type { ParticipacionCursoFormacion } from "@/lib/formacion-api";

function csvCell(value: string | number | null | undefined) {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

export function participantesCursoCsv(titulo: string, rows: ParticipacionCursoFormacion[]) {
    const headers = ["Curso", "Nombre", "Correo", "Dependencia actual", "Cargo actual", "Vinculación", "Resultado", "Mejor puntaje (%)", "Intentos", "Fecha del resultado", "Última presentación", "Certificado"];
    const date = (value: string) => new Date(value).toLocaleString("es-CO", { timeZone: "America/Bogota" });
    return "\uFEFF" + [headers, ...rows.map((row) => [
        titulo, row.nombreCompleto, row.correo, row.dependencia, row.cargo,
        row.tipoVinculacion, row.aprobado ? "Aprobado" : "No aprobado",
        row.mejorPuntaje, row.numeroIntentos, date(row.fechaResultadoUtc),
        date(row.ultimaPresentacionUtc), row.codigoCertificado,
    ])].map((cells) => cells.map(csvCell).join(";")).join("\r\n");
}

export function descargarParticipantesCurso(titulo: string, rows: ParticipacionCursoFormacion[]) {
    const url = URL.createObjectURL(new Blob([participantesCursoCsv(titulo, rows)], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    const name = titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80);
    link.download = `participantes-${name || "curso"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
