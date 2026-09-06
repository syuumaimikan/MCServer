import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processManager } from './processManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

function readJsonSafe(filePath, fallback = []) {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
}

function writeJsonSafe(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Get all player management lists
 */
export function getPlayerLists(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const ops = readJsonSafe(path.join(serverDir, 'ops.json'));
  const whitelist = readJsonSafe(path.join(serverDir, 'whitelist.json'));
  const bannedPlayers = readJsonSafe(path.join(serverDir, 'banned-players.json'));
  const bannedIps = readJsonSafe(path.join(serverDir, 'banned-ips.json'));

  const liveState = processManager.getServerState(serverId);

  return {
    onlinePlayers: liveState.players || [],
    ops: ops.map(o => (typeof o === 'string' ? { name: o } : o)),
    whitelist: whitelist.map(w => (typeof w === 'string' ? { name: w } : w)),
    bannedPlayers: bannedPlayers.map(b => (typeof b === 'string' ? { name: b } : b)),
    bannedIps: bannedIps
  };
}

/**
 * Execute in-game player command
 */
export function executePlayerAction(serverId, action, { player, target, gamemode, item, amount, reason }) {
  const isOnline = processManager.getServerState(serverId).status === 'RUNNING';

  switch (action) {
    case 'kick':
      if (isOnline) processManager.sendCommand(serverId, `kick ${player} ${reason || 'Kicked by administrator'}`);
      return { success: true, message: `Kicked ${player}` };

    case 'ban':
      if (isOnline) processManager.sendCommand(serverId, `ban ${player} ${reason || 'Banned by administrator'}`);
      return { success: true, message: `Banned ${player}` };

    case 'unban':
      if (isOnline) processManager.sendCommand(serverId, `pardon ${player}`);
      return { success: true, message: `Unbanned ${player}` };

    case 'op':
      if (isOnline) processManager.sendCommand(serverId, `op ${player}`);
      return { success: true, message: `Promoted ${player} to Operator` };

    case 'deop':
      if (isOnline) processManager.sendCommand(serverId, `deop ${player}`);
      return { success: true, message: `Removed Operator from ${player}` };

    case 'whitelist_add':
      if (isOnline) processManager.sendCommand(serverId, `whitelist add ${player}`);
      return { success: true, message: `Added ${player} to whitelist` };

    case 'whitelist_remove':
      if (isOnline) processManager.sendCommand(serverId, `whitelist remove ${player}`);
      return { success: true, message: `Removed ${player} from whitelist` };

    case 'gamemode':
      if (isOnline) processManager.sendCommand(serverId, `gamemode ${gamemode || 'survival'} ${player}`);
      return { success: true, message: `Set gamemode for ${player} to ${gamemode}` };

    case 'teleport':
      if (isOnline) processManager.sendCommand(serverId, `tp ${player} ${target}`);
      return { success: true, message: `Teleported ${player} to ${target}` };

    case 'give':
      if (isOnline) processManager.sendCommand(serverId, `give ${player} ${item || 'minecraft:diamond'} ${amount || 1}`);
      return { success: true, message: `Gave ${amount || 1}x ${item} to ${player}` };

    default:
      throw new Error(`Unknown player action: ${action}`);
  }
}
