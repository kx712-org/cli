import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface CliConfig {
  apiKey?: string;
  apiUrl?: string;
}

const CONFIG_DIR = join(homedir(), ".webgune");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export const DEFAULT_API_URL = "https://api.webgune.cloud";
export const DEFAULT_DASHBOARD_URL = "https://webgune.cloud";

export function loadConfig(): CliConfig {
  let fileConfig: CliConfig = {};
  if (existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
    } catch {
      /* fichier corrompu — ignoré, l'utilisateur peut relancer `webgune login` */
    }
  }
  return {
    apiKey: process.env.WEBGUNE_API_KEY || fileConfig.apiKey,
    apiUrl: process.env.WEBGUNE_API_URL || fileConfig.apiUrl || DEFAULT_API_URL,
  };
}

export function saveConfig(config: CliConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
}

export function clearConfig(): void {
  if (existsSync(CONFIG_FILE)) rmSync(CONFIG_FILE);
}

export function configPath(): string {
  return CONFIG_FILE;
}
