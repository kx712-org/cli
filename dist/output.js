/** Sortie tabulaire simple, alignée en colonnes, sans dépendance. */
export function table(rows, columns) {
    if (rows.length === 0) {
        console.log("(aucun résultat)");
        return;
    }
    const widths = columns.map((c) => Math.max(c.label.length, ...rows.map((r) => String(r[c.key] ?? "—").length)));
    const line = (cells) => cells.map((cell, i) => cell.padEnd(widths[i])).join("  ");
    console.log(line(columns.map((c) => c.label)));
    console.log(line(widths.map((w) => "─".repeat(w))));
    for (const row of rows) {
        console.log(line(columns.map((c) => String(row[c.key] ?? "—"))));
    }
}
export function isJsonMode(argv) {
    return argv.includes("--json");
}
export function printJson(data) {
    console.log(JSON.stringify(data, null, 2));
}
export function fail(message) {
    console.error(message);
    process.exit(1);
}
export function formatDate(value) {
    if (!value)
        return "—";
    return new Date(value).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
}
