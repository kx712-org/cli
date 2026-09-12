import readline from "node:readline";
import rl from "node:readline/promises";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
function useColor() {
    return !!process.stdout.isTTY && !process.env.NO_COLOR;
}
function c(code, s) {
    return useColor() ? `${code}${s}${RESET}` : s;
}
/**
 * Efface l'écran visible + le défilement et ramène le curseur en haut à gauche.
 * Sans ça, chaque nouveau menu s'imprime SOUS le précédent et les pages
 * s'empilent (grille tarifaire + menus superposés). No-op hors TTY.
 */
export function clearScreen() {
    if (process.stdout.isTTY)
        process.stdout.write("\x1b[2J\x1b[3J\x1b[H");
}
/** Menu à navigation flèches/Entrée, sans dépendance externe. */
export async function selectMenu(title, items) {
    if (!process.stdin.isTTY) {
        throw new Error("Menu interactif indisponible (stdin non-TTY) — utilisez les sous-commandes directement (webgune --help).");
    }
    return new Promise((resolve) => {
        let index = 0;
        let firstRender = true;
        const lineCount = items.length + 3; // titre, ligne vide, items, aide
        const draw = () => {
            const lines = [];
            lines.push(c(BOLD, title));
            lines.push("");
            items.forEach((item, i) => {
                const pointer = i === index ? c(CYAN, "❯") : " ";
                const label = i === index ? c(CYAN, item.label) : item.label;
                const hint = item.hint ? "  " + c(GRAY, item.hint) : "";
                lines.push(`${pointer} ${label}${hint}`);
            });
            lines.push(c(GRAY, "↑/↓ naviguer · Entrée valider · Échap retour"));
            if (firstRender) {
                // Nouvelle page de menu : on repart d'un écran propre.
                clearScreen();
            }
            else {
                // Simple navigation ↑/↓ : on redessine en place.
                readline.moveCursor(process.stdout, 0, -lineCount);
                readline.clearScreenDown(process.stdout);
            }
            firstRender = false;
            process.stdout.write(lines.join("\n") + "\n");
        };
        readline.emitKeypressEvents(process.stdin);
        process.stdin.resume();
        process.stdin.setRawMode(true);
        process.stdout.write("\x1b[?25l");
        const cleanup = () => {
            process.stdin.removeListener("keypress", onKeypress);
            process.stdin.setRawMode(false);
            process.stdout.write("\x1b[?25h");
        };
        const onKeypress = (_str, key) => {
            if (key.ctrl && key.name === "c") {
                cleanup();
                process.exit(130);
            }
            if (key.name === "up" || key.name === "k") {
                index = (index - 1 + items.length) % items.length;
                draw();
            }
            else if (key.name === "down" || key.name === "j") {
                index = (index + 1) % items.length;
                draw();
            }
            else if (key.name === "return") {
                cleanup();
                resolve(items[index].value);
            }
            else if (key.name === "escape" || key.name === "q") {
                cleanup();
                resolve(null);
            }
        };
        process.stdin.on("keypress", onKeypress);
        draw();
    });
}
export async function confirm(question) {
    const choice = await selectMenu(question, [
        { label: "Oui", value: "yes" },
        { label: "Non", value: "no" },
    ]);
    return choice === "yes";
}
export async function promptText(question, opts) {
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
    const suffix = opts?.default ? ` (${opts.default})` : "";
    const answer = (await iface.question(`${question}${suffix} : `)).trim();
    iface.close();
    return answer || opts?.default || "";
}
export async function pause(message = "Entrée pour continuer…") {
    const iface = rl.createInterface({ input: process.stdin, output: process.stdout });
    await iface.question(c(GRAY, message));
    iface.close();
}
