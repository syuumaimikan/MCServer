import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { commitServerChange } from './gitManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

/**
 * Parses server.properties file into key-value pairs
 */
export function getServerProperties(serverId) {
  const propPath = path.join(SERVERS_DIR, serverId, 'server.properties');
  if (!fs.existsSync(propPath)) {
    return {};
  }

  const content = fs.readFileSync(propPath, 'utf8');
  const properties = {};

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex !== -1) {
      const key = trimmed.slice(0, eqIndex).trim();
      let val = trimmed.slice(eqIndex + 1).trim();

      // Type conversions
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (!isNaN(val) && val !== '') val = Number(val);

      properties[key] = val;
    }
  }

  return properties;
}

/**
 * Saves server.properties file
 */
export function saveServerProperties(serverId, newProperties) {
  const propPath = path.join(SERVERS_DIR, serverId, 'server.properties');
  const existing = getServerProperties(serverId);
  const merged = { ...existing, ...newProperties };

  const lines = [
    '#Minecraft server properties',
    `#Updated by CraftOS on ${new Date().toISOString()}`
  ];

  for (const [key, val] of Object.entries(merged)) {
    lines.push(`${key}=${val}`);
  }

  fs.writeFileSync(propPath, lines.join('\n') + '\n', 'utf8');
  commitServerChange(serverId, 'Updated server.properties configuration', 'config');
  return merged;
}

/**
 * Gets CraftOS specific server config (RAM, Aikar flags, Java path)
 */
export function getCraftosConfig(serverId) {
  const configPath = path.join(SERVERS_DIR, serverId, 'craftos-config.json');
  if (!fs.existsSync(configPath)) {
    return {
      id: serverId,
      name: serverId,
      type: 'fabric',
      version: '1.21.1',
      ram: 4,
      port: 25565,
      javaPath: 'java',
      aikarFlags: true,
      autoRestart: false
    };
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

/**
 * Saves CraftOS server config
 */
export function saveCraftosConfig(serverId, newConfig) {
  const configPath = path.join(SERVERS_DIR, serverId, 'craftos-config.json');
  const existing = getCraftosConfig(serverId);
  const merged = { ...existing, ...newConfig, updatedAt: new Date().toISOString() };
  fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8');
  commitServerChange(serverId, `Updated CraftOS system settings (RAM: ${merged.ram}GB, GC: ${merged.gcPreset || (merged.aikarFlags ? 'Aikar' : 'Standard')})`, 'config');
  return merged;
}
