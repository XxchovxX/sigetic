import jsPDF from "jspdf";
import type { FormacionCertificado } from "@/lib/formacion-api";

async function loadImage(path: string) {
    const response = await fetch(path);
    if (!response.ok) throw new Error("No fue posible cargar la identidad institucional.");
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function durationLabel(minutes: number) {
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;
    return remaining ? `${hours} h ${remaining} min` : `${hours} ${hours === 1 ? "hora" : "horas"}`;
}

function safeFilename(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
}

export async function descargarCertificadoFormacionPdf(certificado: FormacionCertificado) {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
    const logo = await loadImage("/identity/logo-alcaldia.png");
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    doc.setFillColor(248, 250, 248);
    doc.rect(0, 0, width, height, "F");
    doc.setDrawColor(0, 107, 46);
    doc.setLineWidth(1.4);
    doc.roundedRect(10, 10, width - 20, height - 20, 3, 3);
    doc.setDrawColor(245, 196, 0);
    doc.setLineWidth(0.5);
    doc.roundedRect(14, 14, width - 28, height - 28, 2, 2);

    doc.addImage(logo, "PNG", 20, 17, 38, 25);
    doc.setTextColor(20, 35, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("ALCALDÍA MUNICIPAL DE SAN CARLOS DE GUAROA", width / 2, 25, { align: "center" });
    doc.setTextColor(0, 107, 46);
    doc.setFontSize(9);
    doc.text(certificado.entidadCertificadora.toUpperCase(), width / 2, 32, { align: "center" });

    doc.setTextColor(20, 35, 59);
    doc.setFontSize(24);
    doc.text("CONSTANCIA DE FORMACIÓN", width / 2, 53, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("La dependencia certifica que", width / 2, 65, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0, 107, 46);
    doc.text(certificado.participanteNombre, width / 2, 79, { align: "center", maxWidth: 190 });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text("realizó y aprobó satisfactoriamente la actividad formativa", width / 2, 91, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 35, 59);
    const titleLines = doc.splitTextToSize(certificado.cursoTitulo, 190);
    doc.text(titleLines, width / 2, 104, { align: "center" });

    const detailY = 123 + Math.max(0, titleLines.length - 1) * 6;
    doc.setFillColor(236, 248, 240);
    doc.roundedRect(49, detailY, width - 98, 21, 2, 2, "F");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(`Duración: ${durationLabel(certificado.duracionMinutos)}`, 70, detailY + 9);
    doc.text(`Resultado: ${Math.round(certificado.puntaje)}%`, width / 2, detailY + 9, { align: "center" });
    doc.text(`Fecha: ${new Date(certificado.fechaPresentacionUtc).toLocaleDateString("es-CO")}`, width - 70, detailY + 9, { align: "right" });
    doc.setFontSize(8);
    doc.text(`Categoría: ${certificado.categoria}`, width / 2, detailY + 16, { align: "center" });

    doc.setDrawColor(150, 160, 170);
    doc.line(width / 2 - 35, height - 42, width / 2 + 35, height - 42);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 35, 59);
    doc.text(certificado.entidadCertificadora, width / 2, height - 35, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 100, 115);
    doc.setFontSize(7.5);
    doc.text("Constancia interna generada por SIGETIC. No reemplaza certificaciones académicas.", width / 2, height - 27, { align: "center" });
    doc.text(`Código de verificación: ${certificado.codigoCertificado}`, width / 2, height - 21, { align: "center" });

    doc.save(`constancia-${safeFilename(certificado.participanteNombre)}-${safeFilename(certificado.cursoTitulo)}.pdf`);
}
