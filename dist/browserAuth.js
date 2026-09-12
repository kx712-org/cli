/* ─── Connexion via navigateur (mini-OAuth loopback) ──────────────────────────
 * Même principe que l'extension VS Code : on démarre un serveur HTTP éphémère
 * sur 127.0.0.1 (port aléatoire), on ouvre `<dashboard>/cli-auth?state=…&port=…`
 * dans le navigateur par défaut ; la page (session cookie du navigateur) crée
 * une clé API et redirige vers http://127.0.0.1:<port>/callback?state=…&key=…
 * Le `state` aléatoire empêche une page tierce de pousser une clé forgée. */
import * as crypto from "node:crypto";
import * as http from "node:http";
import { spawn } from "node:child_process";
const TIMEOUT_MS = 5 * 60 * 1000;
function openUrl(url) {
    try {
        if (process.platform === "win32") {
            // `cmd /c start` fait repasser l'URL par le parseur de cmd.exe, qui
            // coupe sur `&` (présent entre state= et port=) faute d'espace forçant
            // Node à la quoter. rundll32 appelle directement le protocole par défaut
            // sans repasser par un interpréteur de commandes — pas d'interprétation
            // des métacaractères.
            spawn("rundll32", ["url.dll,FileProtocolHandler", url], { stdio: "ignore", detached: true, windowsHide: true }).unref();
        }
        else if (process.platform === "darwin") {
            spawn("open", [url], { stdio: "ignore", detached: true }).unref();
        }
        else {
            spawn("xdg-open", [url], { stdio: "ignore", detached: true }).unref();
        }
    }
    catch {
        /* pas grave — l'URL est aussi affichée en repli */
    }
}
export async function signInViaBrowser(dashboardUrl) {
    const state = crypto.randomBytes(20).toString("hex");
    return new Promise((resolve) => {
        let settled = false;
        const finish = (key) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            server.close();
            resolve(key);
        };
        const server = http.createServer((req, res) => {
            const url = new URL(req.url ?? "/", "http://127.0.0.1");
            if (url.pathname !== "/callback") {
                res.statusCode = 404;
                res.end();
                return;
            }
            const stateOk = url.searchParams.get("state") === state;
            const denied = url.searchParams.get("error");
            const key = url.searchParams.get("key");
            const ok = stateOk && !denied && !!key && key.startsWith("wgk_");
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(resultPage(ok, denied === "denied"));
            finish(ok ? key : undefined);
        });
        const timer = setTimeout(() => finish(undefined), TIMEOUT_MS);
        server.on("error", () => finish(undefined));
        server.listen(0, "127.0.0.1", () => {
            const address = server.address();
            const port = typeof address === "object" && address ? address.port : 0;
            if (!port) {
                finish(undefined);
                return;
            }
            const target = `${dashboardUrl}/cli-auth?state=${state}&port=${port}`;
            console.log("Ouverture du navigateur pour autoriser le CLI…");
            console.log(`Si rien ne s'ouvre, copiez ce lien : ${target}`);
            openUrl(target);
        });
    });
}
function resultPage(ok, denied) {
    const title = ok ? "CLI connecté ✔" : denied ? "Connexion refusée" : "Échec de la connexion";
    const body = ok
        ? "Votre compte webgune est lié. Vous pouvez fermer cet onglet et retourner dans le terminal."
        : denied
            ? "Aucune clé n'a été créée. Vous pouvez fermer cet onglet."
            : "Le lien de connexion est invalide ou expiré — relancez `webgune login` depuis le terminal.";
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0e14;color:#e6e6e6;font-family:system-ui,sans-serif}
.card{max-width:420px;padding:32px;border:1px solid #262b36;border-radius:16px;background:#11151d;text-align:center}
h1{font-size:18px;margin:0 0 8px}p{font-size:13px;color:#9aa3b2;line-height:1.6;margin:0}</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
}
