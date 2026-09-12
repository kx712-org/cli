import { loadConfig, saveConfig, clearConfig, configPath, DEFAULT_API_URL, DEFAULT_DASHBOARD_URL } from "../config.js";
import { apiFetch } from "../api.js";
import { signInViaBrowser } from "../browserAuth.js";
function getFlag(argv, name) {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
}
export async function login(argv) {
    let key = getFlag(argv, "--key");
    const apiUrl = getFlag(argv, "--api-url") ?? DEFAULT_API_URL;
    const dashboardUrl = getFlag(argv, "--dashboard-url") ?? DEFAULT_DASHBOARD_URL;
    if (!key) {
        if (!process.stdin.isTTY) {
            console.error("Connexion via navigateur indisponible (stdin non-TTY). " +
                "Passez une clé directement : webgune login --key wgk_… (ou WEBGUNE_API_KEY).");
            process.exit(1);
        }
        key = await signInViaBrowser(dashboardUrl);
        if (!key) {
            console.error("Connexion annulée ou expirée. Réessayez, ou passez une clé directement : webgune login --key wgk_…");
            process.exit(1);
        }
    }
    if (!key.startsWith("wgk_")) {
        console.error("Clé invalide — une clé API webgune commence par wgk_.");
        process.exit(1);
    }
    saveConfig({ apiKey: key, apiUrl });
    // Validation immédiate : un appel léger en lecture.
    try {
        await apiFetch("/api/projects");
        console.log(`Connecté. Configuration enregistrée dans ${configPath()}`);
    }
    catch (e) {
        clearConfig();
        console.error(`Échec de la validation de la clé : ${e instanceof Error ? e.message : e}`);
        process.exit(1);
    }
}
export function logout() {
    clearConfig();
    console.log("Déconnecté — clé API supprimée.");
}
export function whoami() {
    const { apiKey, apiUrl } = loadConfig();
    if (!apiKey) {
        console.log("Non connecté. Lancez `webgune login`.");
        return;
    }
    console.log(`Clé API : ${apiKey.slice(0, 12)}…`);
    console.log(`API     : ${apiUrl}`);
}
