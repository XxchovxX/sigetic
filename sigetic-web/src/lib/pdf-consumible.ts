import jsPDF from "jspdf";
import type { Consumible, MovimientoConsumible } from "@/lib/consumibles-api";

type ExportConsumiblePdfInput = {
    consumible: Consumible;
    movimientos: MovimientoConsumible[];
};

function formatDate(value: string) {
    return value.slice(0, 10);
}

async function loadImage(path: string) {
    const response = await fetch(path);
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function drawHeader(doc: jsPDF, escudo: string) {
    doc.setDrawColor(20, 35, 59);
    doc.setLineWidth(0.2);
    doc.rect(14, 12, 182, 26);
    doc.line(45, 12, 45, 38);
    doc.line(145, 12, 145, 38);

    doc.addImage(escudo, "PNG", 20, 15, 18, 18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("HOJA DE VIDA DE CONSUMIBLE", 95, 25, { align: "center" });

    doc.setFontSize(7);
    doc.text("CÓDIGO: TIC-HV-CON-01", 149, 17);
    doc.text("VERSIÓN: 01", 149, 23);
    doc.text(`FECHA: ${new Date().toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric",
    })}`, 149, 29);
    doc.text("PÁGINA: 1 DE 1", 149, 35);
}

export async function exportConsumiblePdf({
    consumible,
    movimientos,
}: ExportConsumiblePdfInput) {
    const doc = new jsPDF({ unit: "mm", format: "letter" });
    const escudo = await loadImage("/pdf/escudo-san-carlos.png");
    const pie = await loadImage("/pdf/pie-pagina-alcaldia.png");

    drawHeader(doc, escudo);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Información general", 14, 50);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const rows = [
        ["Código interno", consumible.codigoInterno],
        ["Nombre", consumible.nombre],
        ["Tipo", consumible.tipoConsumible],
        ["Referencia", consumible.referencia],
        ["Color", consumible.color],
        ["Unidad", consumible.unidadMedida],
        ["Stock actual", String(consumible.stockActual)],
        ["Stock mínimo", String(consumible.stockMinimo)],
        ["Estado", consumible.activo ? "Activo" : "Inactivo"],
        ["Alerta", consumible.bajoStock ? "Bajo stock" : "Stock suficiente"],
    ];

    let y = 58;
    rows.forEach(([label, value], index) => {
        const x = index % 2 === 0 ? 14 : 110;
        if (index % 2 === 0 && index > 0) y += 8;
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, x, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, x + 30, y);
    });

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("Últimos movimientos", 14, y);
    y += 8;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Fecha", 14, y);
    doc.text("Tipo", 42, y);
    doc.text("Cant.", 73, y);
    doc.text("Responsable", 92, y);
    doc.text("Destino", 142, y);
    doc.text("Stock", 184, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    movimientos.slice(0, 14).forEach((item) => {
        doc.text(formatDate(item.fechaMovimiento), 14, y);
        doc.text(item.tipoMovimiento, 42, y);
        doc.text(String(item.cantidad), 75, y);
        doc.text(item.responsable.slice(0, 28), 92, y);
        doc.text((item.impresora ?? item.dependencia ?? item.destino ?? "Inventario").slice(0, 24), 142, y);
        doc.text(String(item.stockResultante), 185, y);
        y += 7;
    });

    if (movimientos.length === 0) {
        doc.text("No hay movimientos registrados.", 14, y);
    }

    doc.addImage(pie, "PNG", 14, 244, 182, 22);
    doc.save(`consumible-${consumible.codigoInterno}.pdf`);
}
