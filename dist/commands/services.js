import { apiFetch } from "../api.js";
import { table, isJsonMode, printJson, fail, formatDate } from "../output.js";
function getFlag(argv, name) {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
}
export async function services(argv) {
    const [sub, ...rest] = argv;
    const id = rest.find((a) => !a.startsWith("--"));
    switch (sub) {
        case "list":
        case undefined: {
            const projectId = getFlag(argv, "--project");
            const path = projectId ? `/api/services/project/${projectId}` : "/api/services";
            const data = await apiFetch(path);
            if (isJsonMode(argv))
                return printJson(data);
            table(data.map((s) => ({ id: s.id, name: s.name, type: s.type ?? "—", status: s.status ?? "—" })), [
                { key: "id", label: "ID" },
                { key: "name", label: "NOM" },
                { key: "type", label: "TYPE" },
                { key: "status", label: "STATUT" },
            ]);
            return;
        }
        case "info": {
            if (!id)
                fail("Usage : webgune services info <id>");
            const data = await apiFetch(`/api/services/${id}`);
            return printJson(data);
        }
        case "logs": {
            if (!id)
                fail("Usage : webgune services logs <id> [--tail <n>]");
            const tail = getFlag(argv, "--tail") ?? "200";
            const data = await apiFetch(`/api/services/${id}/logs?tail=${tail}`);
            if (Array.isArray(data))
                data.forEach((l) => console.log(l));
            else if (typeof data === "object" && data.logs)
                console.log(data.logs);
            else
                printJson(data);
            return;
        }
        case "redeploy": {
            if (!id)
                fail("Usage : webgune services redeploy <id>");
            await apiFetch(`/api/services/${id}/redeploy`, { method: "POST" });
            console.log("Redéploiement lancé.");
            return;
        }
        case "restart": {
            if (!id)
                fail("Usage : webgune services restart <id>");
            await apiFetch(`/api/services/${id}/restart`, { method: "POST" });
            console.log("Redémarrage lancé.");
            return;
        }
        case "stop": {
            if (!id)
                fail("Usage : webgune services stop <id>");
            await apiFetch(`/api/services/${id}/stop`, { method: "POST" });
            console.log("Service arrêté.");
            return;
        }
        case "start": {
            if (!id)
                fail("Usage : webgune services start <id>");
            await apiFetch(`/api/services/${id}/start`, { method: "POST" });
            console.log("Service démarré.");
            return;
        }
        case "deployments": {
            if (!id)
                fail("Usage : webgune services deployments <id>");
            const data = await apiFetch(`/api/services/${id}/deployments`);
            if (isJsonMode(argv))
                return printJson(data);
            table(data.map((d) => ({
                id: d.id,
                status: d.status,
                commit: d.commitSha ? d.commitSha.slice(0, 7) : "—",
                date: formatDate(d.createdAt),
            })), [
                { key: "id", label: "ID" },
                { key: "status", label: "STATUT" },
                { key: "commit", label: "COMMIT" },
                { key: "date", label: "DATE" },
            ]);
            return;
        }
        case "rollback": {
            const deploymentId = rest.filter((a) => !a.startsWith("--"))[1];
            if (!id || !deploymentId)
                fail("Usage : webgune services rollback <serviceId> <deploymentId>");
            await apiFetch(`/api/services/${id}/deployments/${deploymentId}/rollback`, { method: "POST" });
            console.log("Rollback lancé.");
            return;
        }
        default:
            fail(`Sous-commande inconnue : services ${sub}\n` +
                "Usage : webgune services <list|info|logs|redeploy|restart|stop|start|deployments|rollback>");
    }
}
