# webgune

CLI officiel de [webgune.cloud](https://webgune.cloud) — déployez et gérez vos services depuis le terminal.

## Installation

```bash
npm install -g @webgune/cli
# ou, sans installation :
npx @webgune/cli
```

La commande installée s'appelle `webgune`.

Nécessite Node.js ≥ 18.

## Démarrage

```bash
webgune login      # ouvre le navigateur pour autoriser le CLI
webgune            # menu interactif (flèches + Entrée)
```

Pour un usage scripté / CI, passez la clé directement :

```bash
webgune login --key wgk_…
# ou via l'environnement
export WEBGUNE_API_KEY=wgk_…
```

## Commandes

```
webgune                                 Menu interactif
webgune login [--key wgk_…]             S'authentifier
webgune logout                          Supprimer la clé API locale
webgune whoami                          Afficher la configuration active

webgune projects list|create|delete     Gérer vos projets
webgune services list|info|logs|…        Gérer vos services
webgune services redeploy|restart|stop   Cycle de vie d'un service
webgune services deployments|rollback    Historique & retour arrière
webgune billing plans|subscription|…     Facturation
webgune domains list                     Vos noms de domaine
```

Options globales : `--json` (sortie brute), `--help`, `--version`.

## Variables d'environnement

| Variable            | Rôle                                    |
| ------------------- | --------------------------------------- |
| `WEBGUNE_API_KEY`   | Clé API (prioritaire sur la config locale) |
| `WEBGUNE_API_URL`   | URL de l'API (défaut `https://api.webgune.cloud`) |
| `NO_COLOR`          | Désactive la couleur                    |

La configuration locale est stockée dans `~/.webgune/config.json` (droits `600`).
