// RFC 4180 CSV. Text cells that start with = + - @ (or a tab / carriage return) get a leading apostrophe,
// otherwise Excel and Sheets would run them as formulas when the file is opened (CSV injection).
function csvCell(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') return String(value);

    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
    return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
