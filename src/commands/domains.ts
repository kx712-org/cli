import { apiFetch } from "../api.js";
import { table, isJsonMode, printJson, fail, formatDate } from "../output.js";

interface Domain {
  id: string;
  fullDomain: string;
  status: string;
  createdAt?: string;
}

export async function domains(argv: string[]): Promise<void> {
  const [sub] = argv;

  switch (sub) {
    case "list":
    case undefined: {
      const data = await apiFetch<Domain[]>("/api/domains");
      if (isJsonMode(argv)) return printJson(data);
      table(
        data.map((d) => ({ id: d.id, domain: d.fullDomain, status: d.status, created: formatDate(d.createdAt) })),
        [
          { key: "id", label: "ID" },
          { key: "domain", label: "DOMAINE" },
          { key: "status", label: "STATUT" },
          { key: "created", label: "CRÉÉ LE" },
        ]
      );
      return;
    }
    default:
      fail(`Sous-commande inconnue : domains ${sub}\nUsage : webgune domains list`);
  }
}
