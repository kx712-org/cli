import { apiFetch } from "../api.js";
import { table, isJsonMode, printJson, fail, formatDate } from "../output.js";
export async function domains(argv) {
    const [sub] = argv;
    switch (sub) {
        case "list":
        case undefined: {
            const data = await apiFetch("/api/domains");
            if (isJsonMode(argv))
                return printJson(data);
            table(data.map((d) => ({ id: d.id, domain: d.fullDomain, status: d.status, created: formatDate(d.createdAt) })), [
                { key: "id", label: "ID" },
                { key: "domain", label: "DOMAINE" },
                { key: "status", label: "STATUT" },
                { key: "created", label: "CRÉÉ LE" },
            ]);
            return;
        }
        default:
            fail(`Sous-commande inconnue : domains ${sub}\nUsage : webgune domains list`);
    }
}
