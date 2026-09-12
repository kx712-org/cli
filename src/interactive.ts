import { login, logout, whoami } from "./commands/login.js";
import { projects } from "./commands/projects.js";
import { services } from "./commands/services.js";
import { billing } from "./commands/billing.js";
import { domains } from "./commands/domains.js";
import { apiFetch, ApiError } from "./api.js";
import { loadConfig } from "./config.js";
import { selectMenu, promptText, confirm, pause, clearScreen, type MenuItem } from "./tui.js";

interface Named {
  id: string;
  name: string;
}

interface DeploymentEntry {
  id: string;
  status: string;
  commitSha?: string | null;
  createdAt?: string;
}

/** Exécute une action, capture les erreurs API pour rester dans le menu, puis attend Entrée. */
async function run(action: () => Promise<void>): Promise<void> {
  clearScreen(); // la sortie de l'action s'affiche sur une page propre, pas sous le menu
  try {
    await action();
  } catch (e) {
    console.error(e instanceof ApiError ? e.message : e instanceof Error ? e.message : e);
  }
  await pause();
}

function requireAuth(): boolean {
  const { apiKey } = loadConfig();
  if (!apiKey) {
    console.log("Non connecté. Utilisez « Connexion » pour ajouter une clé API.");
    return false;
  }
  return true;
}

async function pickOne(list: Named[], title: string): Promise<string | null> {
  if (list.length === 0) {
    console.log("(aucun élément)");
    await pause();
    return null;
  }
  const items: MenuItem[] = list.map((x) => ({ label: x.name, value: x.id, hint: x.id }));
  items.push({ label: "‹ Retour", value: "__back__" });
  const choice = await selectMenu(title, items);
  if (!choice || choice === "__back__") return null;
  return choice;
}

export async function interactiveMenu(): Promise<void> {
  for (;;) {
    const { apiKey } = loadConfig();
    const choice = await selectMenu("webgune — menu interactif", [
      { label: "Projets", value: "projects", hint: "lister, créer, supprimer" },
      { label: "Services", value: "services", hint: "déployer, logs, redémarrer…" },
      { label: "Facturation", value: "billing", hint: "plans, abonnements, factures" },
      { label: "Domaines", value: "domains" },
      { label: "Connexion", value: "auth", hint: apiKey ? "connecté" : "non connecté" },
      { label: "Quitter", value: "exit" },
    ]);
    if (!choice || choice === "exit") return;
    if (choice === "auth") await authMenu();
    else if (choice === "projects") await projectsMenu();
    else if (choice === "services") await servicesMenu();
    else if (choice === "billing") await billingMenu();
    else if (choice === "domains") await domainsMenu();
  }
}

async function authMenu(): Promise<void> {
  for (;;) {
    const { apiKey } = loadConfig();
    const choice = await selectMenu("Connexion", [
      { label: "Statut", value: "status" },
      { label: apiKey ? "Se reconnecter" : "Se connecter", value: "login" },
      ...(apiKey ? [{ label: "Se déconnecter", value: "logout" }] : []),
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;
    if (choice === "status") await run(async () => whoami());
    else if (choice === "login") await run(() => login([]));
    else if (choice === "logout") await run(async () => logout());
  }
}

async function projectsMenu(): Promise<void> {
  if (!requireAuth()) {
    await pause();
    return;
  }
  for (;;) {
    const choice = await selectMenu("Projets", [
      { label: "Lister", value: "list" },
      { label: "Créer", value: "create" },
      { label: "Supprimer", value: "delete" },
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;
    if (choice === "list") {
      await run(() => projects(["list"]));
    } else if (choice === "create") {
      const name = await promptText("Nom du projet");
      if (!name) continue;
      await run(() => projects(["create", name]));
    } else if (choice === "delete") {
      const list = await apiFetch<Named[]>("/api/projects");
      const id = await pickOne(list, "Quel projet supprimer ?");
      if (!id) continue;
      const target = list.find((p) => p.id === id);
      if (!(await confirm(`Supprimer « ${target?.name ?? id} » ? Action irréversible.`))) continue;
      await run(() => projects(["delete", id]));
    }
  }
}

async function servicesMenu(): Promise<void> {
  if (!requireAuth()) {
    await pause();
    return;
  }
  for (;;) {
    const choice = await selectMenu("Services", [
      { label: "Choisir un service", value: "pick" },
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;
    const list = await apiFetch<Named[]>("/api/services");
    const id = await pickOne(list, "Quel service ?");
    if (!id) continue;
    const svc = list.find((s) => s.id === id);
    await serviceActionsMenu(id, svc?.name ?? id);
  }
}

async function serviceActionsMenu(id: string, name: string): Promise<void> {
  for (;;) {
    const choice = await selectMenu(`Service — ${name}`, [
      { label: "Détails", value: "info" },
      { label: "Logs", value: "logs" },
      { label: "Redéployer", value: "redeploy" },
      { label: "Redémarrer", value: "restart" },
      { label: "Arrêter", value: "stop" },
      { label: "Démarrer", value: "start" },
      { label: "Déploiements / rollback", value: "deployments" },
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;

    if (choice === "info") {
      await run(() => services(["info", id]));
    } else if (choice === "logs") {
      const tail = await promptText("Nombre de lignes", { default: "200" });
      await run(() => services(["logs", id, "--tail", tail]));
    } else if (choice === "redeploy") {
      if (await confirm("Lancer un redéploiement ?")) await run(() => services(["redeploy", id]));
    } else if (choice === "restart") {
      if (await confirm("Redémarrer ce service ?")) await run(() => services(["restart", id]));
    } else if (choice === "stop") {
      if (await confirm("Arrêter ce service ?")) await run(() => services(["stop", id]));
    } else if (choice === "start") {
      await run(() => services(["start", id]));
    } else if (choice === "deployments") {
      await run(() => services(["deployments", id]));
      if (await confirm("Revenir à un déploiement antérieur (rollback) ?")) {
        const deployments = await apiFetch<DeploymentEntry[]>(`/api/services/${id}/deployments`);
        if (deployments.length === 0) {
          console.log("(aucun déploiement)");
          continue;
        }
        const items: MenuItem[] = deployments.map((d) => ({
          label: `${d.status} — ${d.commitSha ? d.commitSha.slice(0, 7) : "—"}`,
          value: d.id,
          hint: d.createdAt ?? "",
        }));
        items.push({ label: "‹ Annuler", value: "__back__" });
        const deployId = await selectMenu("Quel déploiement ?", items);
        if (deployId && deployId !== "__back__") {
          await run(() => services(["rollback", id, deployId]));
        }
      }
    }
  }
}

async function billingMenu(): Promise<void> {
  if (!requireAuth()) {
    await pause();
    return;
  }
  for (;;) {
    const choice = await selectMenu("Facturation", [
      { label: "Grille tarifaire", value: "plans" },
      { label: "Abonnements", value: "subscription" },
      { label: "Factures", value: "invoices" },
      { label: "Résilier", value: "cancel" },
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;

    if (choice === "plans") {
      await run(() => billing(["plans"]));
    } else if (choice === "subscription") {
      await run(() => billing(["subscription"]));
    } else if (choice === "invoices") {
      await run(() => billing(["invoices"]));
    } else if (choice === "cancel") {
      const scope = await selectMenu("Résilier quoi ?", [
        { label: "Abonnement du compte", value: "account" },
        { label: "Abonnement dédié à un projet", value: "project" },
        { label: "‹ Annuler", value: "back" },
      ]);
      if (!scope || scope === "back") continue;
      if (scope === "account") {
        if (await confirm("Résilier l'abonnement du compte ? Effet en fin de période.")) {
          await run(() => billing(["cancel"]));
        }
      } else {
        const list = await apiFetch<Named[]>("/api/projects");
        const id = await pickOne(list, "Quel projet ?");
        if (!id) continue;
        const target = list.find((p) => p.id === id);
        if (await confirm(`Résilier l'abonnement de « ${target?.name ?? id} » ? Effet en fin de période.`)) {
          await run(() => billing(["cancel", "--project", id]));
        }
      }
    }
  }
}

async function domainsMenu(): Promise<void> {
  if (!requireAuth()) {
    await pause();
    return;
  }
  for (;;) {
    const choice = await selectMenu("Domaines", [
      { label: "Lister", value: "list" },
      { label: "‹ Retour", value: "back" },
    ]);
    if (!choice || choice === "back") return;
    if (choice === "list") await run(() => domains(["list"]));
  }
}
