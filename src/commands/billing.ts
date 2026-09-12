import { apiFetch } from "../api.js";
import { table, isJsonMode, printJson, fail, formatDate } from "../output.js";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  limits?: { cpu_cores?: number; memory_mb?: number; storage_gb?: number; cpu_shared?: boolean };
}

interface SubscriptionEntry {
  id: string;
  category: string;
  active: boolean;
  plan: Plan;
  expiresAt: string;
  cancelledAt: string | null;
  projectId: string | null;
  projectName: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  period: string;
  createdAt: string;
}

export async function billing(argv: string[]): Promise<void> {
  const [sub] = argv;

  switch (sub) {
    case "plans": {
      const data = await apiFetch<Plan[]>("/api/billing/plans");
      if (isJsonMode(argv)) return printJson(data);
      table(
        data.map((p) => ({
          name: p.name,
          monthly: `${p.priceMonthly}€/mois`,
          yearly: `${p.priceYearly}€/an`,
          cpu: p.limits?.cpu_cores ? `${p.limits.cpu_cores} vCPU${p.limits.cpu_shared ? " (partagé)" : ""}` : "—",
          ram: p.limits?.memory_mb ? `${p.limits.memory_mb} MiB` : "—",
          storage: p.limits?.storage_gb ? `${p.limits.storage_gb} Go` : "—",
        })),
        [
          { key: "name", label: "PLAN" },
          { key: "monthly", label: "MENSUEL" },
          { key: "yearly", label: "ANNUEL" },
          { key: "cpu", label: "VCPU" },
          { key: "ram", label: "RAM" },
          { key: "storage", label: "STOCKAGE" },
        ]
      );
      console.log("\nPrix HT. Ressources mutualisées (hors stockage) — voir /tos (CGS, Annexe 1).");
      return;
    }
    case "subscription": {
      const data = await apiFetch<{ subscriptions: SubscriptionEntry[]; hasMandate: boolean }>("/api/billing/subscription");
      if (isJsonMode(argv)) return printJson(data);
      table(
        data.subscriptions.map((s) => ({
          scope: s.projectId ? `projet : ${s.projectName ?? s.projectId}` : s.category,
          plan: s.plan?.name ?? "—",
          status: s.cancelledAt ? "résiliation programmée" : s.active ? "actif" : "expiré",
          expires: formatDate(s.expiresAt),
        })),
        [
          { key: "scope", label: "PORTÉE" },
          { key: "plan", label: "PLAN" },
          { key: "status", label: "STATUT" },
          { key: "expires", label: "EXPIRE LE" },
        ]
      );
      console.log(`\nMandat de prélèvement SEPA : ${data.hasMandate ? "actif" : "aucun"}`);
      return;
    }
    case "invoices": {
      const data = await apiFetch<Invoice[]>("/api/billing/invoices");
      if (isJsonMode(argv)) return printJson(data);
      table(
        data.map((i) => ({
          id: i.id.slice(0, 8).toUpperCase(),
          amount: `${i.amount.toFixed(2)}€`,
          status: i.status,
          period: i.period,
          date: formatDate(i.createdAt),
        })),
        [
          { key: "id", label: "N°" },
          { key: "amount", label: "MONTANT" },
          { key: "status", label: "STATUT" },
          { key: "period", label: "PÉRIODE" },
          { key: "date", label: "DATE" },
        ]
      );
      return;
    }
    case "cancel": {
      const projectFlagIndex = argv.indexOf("--project");
      const projectId = projectFlagIndex >= 0 ? argv[projectFlagIndex + 1] : undefined;
      const body = projectId ? { project_id: projectId } : { category: "web" };
      const data = await apiFetch<{ message: string }>("/api/billing/cancel", { method: "POST", body });
      console.log(data.message);
      return;
    }
    default:
      fail(`Sous-commande inconnue : billing ${sub}\nUsage : webgune billing <plans|subscription|invoices|cancel>`);
  }
}
