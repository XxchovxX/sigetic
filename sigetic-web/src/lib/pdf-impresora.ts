import jsPDF from "jspdf";
import type {
    HistorialConsumibleImpresora,
    Impresora,
    MantenimientoImpresora,
} from "@/lib/impresoras-api";

const HEADER_LOGO_PATH = "/pdf/escudo-san-carlos.png";
const FOOTER_IMAGE_PATH = "/pdf/pie-pagina-alcaldia.png";

async function imageToDataUrl(path: string): Promise<string | null> {
    try {
        const response = await fetch(path);
        const blob = await response.blob();

        return await new Promise((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function formatDate(value?: string | null) {
    if (!value) return "No registra";

    const [year, month, day] = value.slice(0, 10).split("-");

    if (!year || !month || !day) return value;

    return `${day}/${month}/${year}`;
}

function safe(value?: string | number | null) {
    if (value === null || value === undefined || value === "") {
        return "No registra";
    }

    return String(value);
}

function getMonthYearUpper(date = new Date()) {
    const formatter = new Intl.DateTimeFormat("es-CO", {
        month: "long",
        year: "numeric",
    });

    return formatter.format(date).toUpperCase();
}

function addFooter(doc: jsPDF, footerImage: string | null) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (footerImage) {
        doc.addImage(footerImage, "PNG", 0, pageHeight - 23, pageWidth, 23);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
        `Generado por SIGETIC - ${new Date().toLocaleDateString("es-CO")}`,
        14,
        pageHeight - 27
    );
}

function addStructuredHeader(
    doc: jsPDF,
    logo: string | null,
    pageNumber: number,
    totalPages: number
) {
    const startX = 14;
    const startY = 10;
    const totalWidth = 182;
    const totalHeight = 24;

    // Proporciones ajustadas al formato institucional:
    // Logo: 34 mm | Título: 87 mm | Datos: 61 mm
    const logoWidth = 34;
    const titleWidth = 87;
    const rowHeight = totalHeight / 4;

    const titleX = startX + logoWidth;
    const metaX = startX + logoWidth + titleWidth;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);

    // Contorno general
    doc.rect(startX, startY, totalWidth, totalHeight);

    // Separadores verticales
    doc.line(titleX, startY, titleX, startY + totalHeight);
    doc.line(metaX, startY, metaX, startY + totalHeight);

    // Filas del bloque derecho
    for (let i = 1; i < 4; i++) {
        doc.line(
            metaX,
            startY + i * rowHeight,
            startX + totalWidth,
            startY + i * rowHeight
        );
    }

    // Logo institucional
    if (logo) {
        doc.addImage(
            logo,
            "PNG",
            startX + 6,
            startY + 2,
            22,
            20
        );
    }

    // Título central
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);

    doc.text(
        "HOJA DE VIDA DE IMPRESORA",
        titleX + titleWidth / 2,
        startY + totalHeight / 2 + 1.5,
        { align: "center" }
    );

    // Bloque derecho compacto
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.7);
    doc.setTextColor(0, 0, 0);

    const textX = metaX + 2.5;

    doc.text(
        "CÓDIGO: TIC-HV-IMP-01",
        textX,
        startY + rowHeight * 0 + 4.3
    );

    doc.text(
        "VERSIÓN: 01",
        textX,
        startY + rowHeight * 1 + 4.3
    );

    doc.text(
        `FECHA: ${getMonthYearUpper()}`,
        textX,
        startY + rowHeight * 2 + 4.3
    );

    doc.text(
        `PÁGINA: ${pageNumber} DE ${totalPages}`,
        textX,
        startY + rowHeight * 3 + 4.3
    );
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
    doc.setFillColor(232, 245, 236);
    doc.roundedRect(14, y, 182, 9, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 107, 46);
    doc.text(title, 18, y + 6);

    return y + 14;
}

function keyValue(
    doc: jsPDF,
    label: string,
    value: string,
    x: number,
    y: number,
    width: number
) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(label, x, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(25, 35, 59);

    const lines = doc.splitTextToSize(value, width);
    doc.text(lines, x, y + 5);

    return y + 5 + lines.length * 4.5;
}

function ensureSpace(
    doc: jsPDF,
    currentY: number,
    requiredSpace: number
) {
    const pageHeight = doc.internal.pageSize.getHeight();

    if (currentY + requiredSpace < pageHeight - 35) {
        return currentY;
    }

    doc.addPage();
    return 45;
}

function drawSimpleTable(
    doc: jsPDF,
    headers: string[],
    rows: string[][],
    startY: number
) {
    let y = startY;
    const x = 14;
    const tableWidth = 182;
    const columnWidth = tableWidth / headers.length;

    y = ensureSpace(doc, y, 18);

    doc.setFillColor(0, 107, 46);
    doc.rect(x, y, tableWidth, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    headers.forEach((header, index) => {
        doc.text(header, x + index * columnWidth + 2, y + 6);
    });

    y += 9;

    if (rows.length === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y, tableWidth, 10, "F");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("No hay registros asociados.", x + 2, y + 6);

        return y + 15;
    }

    rows.forEach((row, rowIndex) => {
        y = ensureSpace(doc, y, 15);

        const rowHeight = 13;

        if (rowIndex % 2 === 0) {
            doc.setFillColor(248, 250, 252);
            doc.rect(x, y, tableWidth, rowHeight, "F");
        }

        doc.setDrawColor(230, 235, 240);
        doc.rect(x, y, tableWidth, rowHeight);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(30, 41, 59);

        row.forEach((cell, index) => {
            const cellX = x + index * columnWidth + 2;
            const lines = doc.splitTextToSize(cell, columnWidth - 4);
            doc.text(lines.slice(0, 2), cellX, y + 5);
        });

        y += rowHeight;
    });

    return y + 8;
}

export async function exportImpresoraPdf({
    impresora,
    mantenimientos,
    consumibles,
}: {
    impresora: Impresora;
    mantenimientos: MantenimientoImpresora[];
    consumibles: HistorialConsumibleImpresora[];
}) {
    const doc = new jsPDF("p", "mm", "a4");

    const logo = await imageToDataUrl(HEADER_LOGO_PATH);
    const footerImage = await imageToDataUrl(FOOTER_IMAGE_PATH);

    let y = 45;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(20, 35, 59);
    doc.text(
        `${impresora.codigoInterno} - ${impresora.marca} ${impresora.modelo}`,
        14,
        y
    );

    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(
        `Serial: ${impresora.serial} | Estado: ${impresora.estado}`,
        14,
        y
    );

    y += 10;

    y = sectionTitle(doc, "1. INFORMACIÓN GENERAL DEL EQUIPO", y);

    const leftX = 14;
    const rightX = 108;
    const width = 82;

    let leftY = y;
    let rightY = y;

    leftY =
        keyValue(
            doc,
            "Código interno",
            impresora.codigoInterno,
            leftX,
            leftY,
            width
        ) + 3;
    rightY = keyValue(doc, "Estado", impresora.estado, rightX, rightY, width) + 3;

    leftY = keyValue(doc, "Marca", impresora.marca, leftX, leftY, width) + 3;
    rightY = keyValue(doc, "Modelo", impresora.modelo, rightX, rightY, width) + 3;

    leftY = keyValue(doc, "Serial", impresora.serial, leftX, leftY, width) + 3;
    rightY =
        keyValue(
            doc,
            "Fecha de ingreso",
            formatDate(impresora.fechaIngreso),
            rightX,
            rightY,
            width
        ) + 3;

    leftY =
        keyValue(
            doc,
            "Tipo de impresora",
            impresora.tipoImpresora,
            leftX,
            leftY,
            width
        ) + 3;
    rightY =
        keyValue(
            doc,
            "Tecnología de impresión",
            impresora.tecnologiaImpresion,
            rightX,
            rightY,
            width
        ) + 3;

    y = Math.max(leftY, rightY) + 5;

    y = ensureSpace(doc, y, 45);
    y = sectionTitle(doc, "2. ASIGNACIÓN, UBICACIÓN Y CONECTIVIDAD", y);

    leftY = y;
    rightY = y;

    leftY =
        keyValue(doc, "Dependencia", impresora.dependencia, leftX, leftY, width) + 3;
    rightY =
        keyValue(
            doc,
            "Funcionario asignado",
            safe(impresora.funcionarioAsignado),
            rightX,
            rightY,
            width
        ) + 3;

    leftY =
        keyValue(
            doc,
            "Ubicación física",
            impresora.ubicacionFisica,
            leftX,
            leftY,
            width
        ) + 3;
    rightY =
        keyValue(
            doc,
            "Dirección IP",
            safe(impresora.direccionIp),
            rightX,
            rightY,
            width
        ) + 3;

    leftY =
        keyValue(
            doc,
            "Dirección MAC",
            safe(impresora.direccionMac),
            leftX,
            leftY,
            width
        ) + 3;
    rightY =
        keyValue(
            doc,
            "Observaciones",
            safe(impresora.observaciones),
            rightX,
            rightY,
            width
        ) + 3;

    y = Math.max(leftY, rightY) + 5;

    y = ensureSpace(doc, y, 45);
    y = sectionTitle(doc, "3. HISTORIAL DE MANTENIMIENTOS", y);

    y = drawSimpleTable(
        doc,
        ["Fecha", "Tipo", "Técnico", "Estado", "Actividad"],
        mantenimientos.map((item) => [
            formatDate(item.fechaMantenimiento),
            item.tipoMantenimiento,
            item.tecnicoResponsable,
            item.estadoResultante,
            item.actividadesRealizadas,
        ]),
        y
    );

    y = ensureSpace(doc, y, 45);
    y = sectionTitle(doc, "4. HISTORIAL DE TINTAS, TÓNER Y CONSUMIBLES", y);

    y = drawSimpleTable(
        doc,
        ["Fecha", "Movimiento", "Consumible", "Color", "Cantidad"],
        consumibles.map((item) => [
            formatDate(item.fechaMovimiento),
            item.tipoMovimiento,
            `${item.tipoConsumible} ${item.referencia}`,
            item.color,
            String(item.cantidad),
        ]),
        y
    );

    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, "5. CONTROL Y TRAZABILIDAD", y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(70, 70, 70);

    const traceabilityText =
        "El presente documento consolida la información técnica y administrativa de la impresora registrada en SIGETIC, incluyendo su identificación, ubicación, asignación, conectividad, historial de mantenimientos y movimientos de consumibles asociados. Esta hoja de vida permite fortalecer el control institucional, la trazabilidad operativa y la toma de decisiones sobre mantenimiento, reposición o baja del equipo.";

    const traceabilityLines = doc.splitTextToSize(traceabilityText, 182);
    doc.text(traceabilityLines, 14, y);

    // Dibujar encabezado y pie en todas las páginas al final
    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        addStructuredHeader(doc, logo, page, totalPages);
        addFooter(doc, footerImage);
    }

    const fileName = `Hoja_vida_impresora_${impresora.codigoInterno}.pdf`
        .replace(/\s+/g, "_")
        .replace(/[^\w.-]/g, "");

    doc.save(fileName);
}
