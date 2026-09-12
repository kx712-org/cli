import { apiFetch } from "../api.js";
import { table, isJsonMode, printJson, fail, formatDate } from "../output.js";
export async function projects(argv) {
    const [sub, ...rest] = argv;
    switch (sub) {
        case "list":
        case undefined: {
            const data = await apiFetch("/api/projects");
            if (isJsonMode(argv))
                return printJson(data);
            table(data.map((p) => ({ id: p.id, name: p.name, created: formatDate(p.createdAt) })), [
                { key: "id", label: "ID" },
                { key: "name", label: "NOM" },
                { key: "created", label: "CRÉÉ LE" },
            ]);
            return;
        }
        case "create": {
            const name = rest.find((a) => !a.startsWith("--"));
            if (!name)
                fail("Usage : webgune projects create <nom>");
            const data = await apiFetch("/api/projects", { method: "POST", body: { name } });
            if (isJsonMode(argv))
                return printJson(data);
            console.log(`Projet créé : ${data.name} (${data.id})`);
            return;
        }
        case "delete": {
            const id = rest.find((a) => !a.startsWith("--"));
            if (!id)
                fail("Usage : webgune projects delete <id>");
            await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
            console.log("Projet supprimé.");
            return;
        }
        default:
            fail(`Sous-commande inconnue : projects ${sub}\nUsage : webgune projects <list|create|delete>`);
    }
}
