#!/usr/bin/env node
import { login, logout, whoami } from "./commands/login.js";
import { projects } from "./commands/projects.js";
import { services } from "./commands/services.js";
import { billing } from "./commands/billing.js";
import { domains } from "./commands/domains.js";
import { interactiveMenu } from "./interactive.js";
import { ApiError } from "./api.js";

const VERSION = "0.1.0";

const HELP = `webgune ${VERSION} — CLI officiel de webgune.cloud

USAGE
  webgune                                 Menu interactif (flèches + Entrée)
  webgune <commande> [sous-commande] [options]

COMMANDES
  login [--key wgk_…] [--api-url <url>]   S'authentifier (ouvre le navigateur, ou --key en CI)
  logout                                  Supprimer la clé API locale
  whoami                                  Afficher la configuration active

  projects list                           Lister vos projets
  projects create <nom>                   Créer un projet
  projects delete <id>                    Supprimer un projet

  services list [--project <id>]          Lister vos services
  services info <id>                      Détails d'un service
  services logs <id> [--tail <n>]         Logs d'un service
  services redeploy <id>                  Relancer un déploiement
  services restart|stop|start <id>        Gérer l'état d'un service
  services deployments <id>               Historique des déploiements
  services rollback <svcId> <deployId>    Revenir à un déploiement antérieur

  billing plans                           Grille tarifaire
  billing subscription                    Vos abonnements, y compris dédiés par projet (+ mandat SEPA)
  billing invoices                        Vos factures
  billing cancel [--project <id>]         Résilier (effet en fin de période — CGS Art. 6.3)

  domains list                            Vos noms de domaine

OPTIONS
  --json                                  Sortie JSON brute
  --help, -h                              Cette aide
  --version, -v                           Version

AUTHENTIFICATION
  webgune login sans --key ouvre le navigateur pour autoriser le CLI (comme
  l'extension VS Code) et récupère la clé automatiquement.
  Pour un usage scripté/CI, passez la clé directement :
  --key wgk_… ou variables d'environnement WEBGUNE_API_KEY, WEBGUNE_API_URL.
`;

async function main() {
  const [, , command, ...rest] = process.argv;

  if (!command) {
    if (!process.stdin.isTTY) {
      console.log(HELP);
      return;
    }
    return await interactiveMenu();
  }
  if (command === "--help" || command === "-h" || command === "help") {
    console.log(HELP);
    return;
  }
  if (command === "--version" || command === "-v" || command === "version") {
    console.log(VERSION);
    return;
  }

  switch (command) {
    case "menu": return await interactiveMenu();
    case "login": return await login(rest);
    case "logout": return logout();
    case "whoami": return whoami();
    case "projects": return await projects(rest);
    case "services": return await services(rest);
    case "billing": return await billing(rest);
    case "domains": return await domains(rest);
    default:
      console.error(`Commande inconnue : ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((e) => {
  if (e instanceof ApiError) console.error(e.message);
  else console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
