/** Sortie tabulaire simple, alignée en colonnes, sans dépendance. */
export function table(rows: Record<string, unknown>[], columns: { key: string; label: string }[]): void {
  if (rows.length === 0) {
    console.log("(aucun résultat)");
    return;
  }
  const widths = columns.map((c) =>
    Math.max(c.label.length, ...rows.map((r) => String(r[c.key] ?? "—").length))
  );
  const line = (cells: string[]) =>
    cells.map((cell, i) => cell.padEnd(widths[i])).join("  ");
  console.log(line(columns.map((c) => c.label)));
  console.log(line(widths.map((w) => "─".repeat(w))));
  for (const row of rows) {
    console.log(line(columns.map((c) => String(row[c.key] ?? "—"))));
  }
}

export function isJsonMode(argv: string[]): boolean {
  return argv.includes("--json");
}

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" });
}
