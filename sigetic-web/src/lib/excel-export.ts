type ExcelColumn<T> = {
    header: string;
    value: (row: T) => string | number | null | undefined;
};

function escapeHtml(value: string | number | null | undefined) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

export function exportRowsToExcel<T>(
    filename: string,
    title: string,
    columns: ExcelColumn<T>[],
    rows: T[]
) {
    const tableRows = rows
        .map((row) => {
            const cells = columns
                .map((column) => `<td>${escapeHtml(column.value(row))}</td>`)
                .join("");

            return `<tr>${cells}</tr>`;
        })
        .join("");

    const headers = columns
        .map((column) => `<th>${escapeHtml(column.header)}</th>`)
        .join("");

    const html = `
        <html>
            <head>
                <meta charset="utf-8" />
                <style>
                    table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
                    th { background: #006b2e; color: #ffffff; font-weight: bold; }
                    th, td { border: 1px solid #9ca3af; padding: 6px; mso-number-format:"\\@"; }
                    h1 { color: #006b2e; font-family: Arial, sans-serif; }
                </style>
            </head>
            <body>
                <h1>${escapeHtml(title)}</h1>
                <table>
                    <thead><tr>${headers}</tr></thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </body>
        </html>
    `;

    const blob = new Blob(["\ufeff", html], {
        type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
