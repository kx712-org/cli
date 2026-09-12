import { loadConfig } from "./config.js";
export class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
/** Appel API authentifié par clé wgk_ (header Authorization: Bearer). */
export async function apiFetch(path, options = {}) {
    const { apiKey, apiUrl } = loadConfig();
    if (!apiKey) {
        console.error("Aucune clé API configurée. Lancez `webgune login` ou définissez WEBGUNE_API_KEY.");
        process.exit(1);
    }
    const res = await fetch(`${apiUrl}${path}`, {
        method: options.method ?? "GET",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
        let message = `Erreur API (${res.status})`;
        try {
            const data = (await res.json());
            if (data?.error)
                message = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
        }
        catch { /* réponse non-JSON */ }
        if (res.status === 401)
            message += " — clé API invalide ou expirée. Relancez `webgune login`.";
        if (res.status === 403)
            message += " — la clé API ne possède pas le scope requis.";
        throw new ApiError(res.status, message);
    }
    return (await res.json());
}
