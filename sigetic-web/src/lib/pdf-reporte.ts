import jsPDF from "jspdf";

type PdfColumn<T> = {
    header: string;
    value: (row: T) => string | number | null | undefined;
    width?: number;
};

type ExportInstitutionalReportInput<T> = {
    fileName: string;
    title: string;
    code: string;
    columns: PdfColumn<T>[];
    rows: T[];
    subtitle?: string;
};

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

function safe(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "No registra";

    return String(value);
}

function formatMonthYear(date = new Date()) {
    return new Intl.DateTimeFormat("es-CO", {
        month: "long",
        year: "numeric",
    }).format(date).toUpperCase();
}

function addHeader(
    doc: jsPDF,
    logo: string | null,
    title: string,
    code: string,
    page: number,
    totalPages: number
) {
    const startX = 14;
    const startY = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const totalWidth = pageWidth - startX * 2;
    const totalHeight = 22;
    const logoWidth = 34;
    const metaWidth = 68;
    const titleWidth = totalWidth - logoWidth - metaWidth;
    const metaX = startX + logoWidth + titleWidth;
    const titleX = startX + logoWidth;
    const rowHeight = totalHeight / 4;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.25);
    doc.rect(startX, startY, totalWidth, totalHeight);
    doc.line(titleX, startY, titleX, startY + totalHeight);
    doc.line(metaX, startY, metaX, startY + totalHeight);

    for (let i = 1; i < 4; i++) {
        doc.line(metaX, startY + i * rowHeight, startX + totalWidth, startY + i * rowHeight);
    }

    if (logo) {
        doc.addImage(logo, "PNG", startX + 7, startY + 2, 20, 18);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.2);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), titleX + titleWidth / 2, startY + totalHeight / 2 + 1.5, {
        align: "center",
        maxWidth: titleWidth - 8,
    });

    doc.setFontSize(7.2);
    doc.text(`CODIGO: ${code}`, metaX + 3, startY + 4.5);
    doc.text("VERSION: 01", metaX + 3, startY + rowHeight + 4.5);
    doc.text(`FECHA: ${formatMonthYear()}`, metaX + 3, startY + rowHeight * 2 + 4.5);
    doc.text(`PAGINA: ${page} DE ${totalPages}`, metaX + 3, startY + rowHeight * 3 + 4.5);
}

function addFooter(doc: jsPDF, footer: string | null) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    if (footer) {
        doc.addImage(footer, "PNG", 0, pageHeight - 23, pageWidth, 23);
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

export async function exportInstitutionalReportPdf<T>({
    fileName,
    title,
    code,
    columns,
    rows,
    subtitle,
}: ExportInstitutionalReportInput<T>) {
    const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "landscape" });
    const logo = await imageToDataUrl("/pdf/escudo-san-carlos.png");
    const footer = await imageToDataUrl("/pdf/pie-pagina-alcaldia.png");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 14;
    const tableWidth = pageWidth - marginX * 2;
    const contentTop = 44;
    const footerLimit = pageHeight - 34;
    const defaultWidth = tableWidth / columns.length;
    const rawWidths = columns.map((column) => column.width ?? defaultWidth);
    const rawTotalWidth = rawWidths.reduce((total, width) => total + width, 0);
    const scale = rawTotalWidth > tableWidth ? tableWidth / rawTotalWidth : 1;
    const widths = rawWidths.map((width) => width * scale);

    let y = contentTop;

    function drawTableHeader() {
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setFillColor(0, 107, 46);
        doc.setTextColor(255, 255, 255);
        doc.rect(marginX, y, tableWidth, 7, "F");

        let headerX = marginX;
        columns.forEach((column, index) => {
            doc.text(column.header, headerX + 2, y + 4.7, {
                maxWidth: widths[index] - 4,
            });
            headerX += widths[index];
        });

        y += 7;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.7);
    }

    function addPageIfNeeded(nextHeight: number) {
        if (y + nextHeight <= footerLimit) return;

        doc.addPage("letter", "landscape");
        y = contentTop;
        drawTableHeader();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 35, 59);
    doc.text(title, marginX, y);
    y += 6;

    if (subtitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(80, 80, 80);
        doc.text(subtitle, marginX, y);
        y += 8;
    }

    drawTableHeader();

    let x = marginX;

    if (rows.length === 0) {
        doc.setTextColor(80, 80, 80);
        doc.text("No hay registros para este informe.", marginX, y + 7);
    } else {
        rows.forEach((row, rowIndex) => {
            const values = columns.map((column, index) => {
                const text = safe(column.value(row));
                return doc.splitTextToSize(text, widths[index] - 4).slice(0, 2);
            });
            const rowHeight = Math.max(7.5, ...values.map((value) => value.length * 3.5 + 3));

            addPageIfNeeded(rowHeight);

            doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, rowIndex % 2 === 0 ? 249 : 255);
            doc.rect(marginX, y, tableWidth, rowHeight, "F");
            doc.setDrawColor(226, 232, 240);
            doc.line(marginX, y + rowHeight, marginX + tableWidth, y + rowHeight);

            x = marginX;
            doc.setTextColor(40, 50, 65);
            values.forEach((value, index) => {
                doc.text(value, x + 2, y + 4.8, { maxWidth: widths[index] - 4 });
                x += widths[index];
            });

            y += rowHeight;
        });
    }

    const totalPages = doc.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
        doc.setPage(page);
        addHeader(doc, logo, title, code, page, totalPages);
        addFooter(doc, footer);
    }

    doc.save(fileName.replace(/\s+/g, "_").replace(/[^\w.-]/g, ""));
}
