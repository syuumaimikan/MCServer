import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { commitServerChange } from './gitManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

function getFolderSize(dirPath) {
  let total = 0;
  if (!fs.existsSync(dirPath)) return 0;
  
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      total += getFolderSize(fullPath);
    } else {
      total += fs.statSync(fullPath).size;
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get world info and dimensions
 */
export function getWorldInfo(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const worldDir = path.join(serverDir, 'world');
  const netherDir = path.join(serverDir, 'world_nether');
  const endDir = path.join(serverDir, 'world_the_end');

  let hasWorld = fs.existsSync(worldDir);
  let mainSize = hasWorld ? getFolderSize(worldDir) : 0;
  let netherSize = fs.existsSync(netherDir) ? getFolderSize(netherDir) : (fs.existsSync(path.join(worldDir, 'DIM-1')) ? getFolderSize(path.join(worldDir, 'DIM-1')) : 0);
  let endSize = fs.existsSync(endDir) ? getFolderSize(endDir) : (fs.existsSync(path.join(worldDir, 'DIM1')) ? getFolderSize(path.join(worldDir, 'DIM1')) : 0);

  // Check level.dat
  let hasLevelDat = fs.existsSync(path.join(worldDir, 'level.dat'));

  return {
    hasWorld,
    worldName: 'world',
    hasLevelDat,
    totalSizeBytes: mainSize + netherSize + endSize,
    totalSize: formatBytes(mainSize + netherSize + endSize),
    dimensions: {
      overworld: { exists: hasWorld, size: formatBytes(mainSize) },
      nether: { exists: netherSize > 0, size: formatBytes(netherSize) },
      end: { exists: endSize > 0, size: formatBytes(endSize) }
    }
  };
}

/**
 * Create a timestamped ZIP backup of the server / world
 */
export async function createBackup(serverId, label = 'manual') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const backupsDir = path.join(serverDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${label}-${timestamp}.zip`;
  const backupFilePath = path.join(backupsDir, backupFileName);

  const output = fs.createWriteStream(backupFilePath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => {
      const stats = fs.statSync(backupFilePath);
      commitServerChange(serverId, `Created snapshot backup: ${backupFileName}`, 'backup');
      resolve({
        success: true,
        fileName: backupFileName,
        size: formatBytes(stats.size),
        sizeBytes: stats.size,
        createdAt: new Date().toISOString()
      });
    });

    archive.on('error', (err) => reject(err));
    archive.pipe(output);

    // Add world directory
    const worldDir = path.join(serverDir, 'world');
    if (fs.existsSync(worldDir)) {
      archive.directory(worldDir, 'world');
    }

    // Add nether/end if separate (Paper/Spigot)
    const netherDir = path.join(serverDir, 'world_nether');
    if (fs.existsSync(netherDir)) archive.directory(netherDir, 'world_nether');

    const endDir = path.join(serverDir, 'world_the_end');
    if (fs.existsSync(endDir)) archive.directory(endDir, 'world_the_end');

    // Add server config files
    const configFiles = ['server.properties', 'craftos-config.json', 'ops.json', 'whitelist.json'];
    for (const f of configFiles) {
      const p = path.join(serverDir, f);
      if (fs.existsSync(p)) {
        archive.file(p, { name: f });
      }
    }

    archive.finalize();
  });
}

/**
 * List all existing backups
 */
export function listBackups(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const backupsDir = path.join(serverDir, 'backups');
  if (!fs.existsSync(backupsDir)) return [];

  const files = fs.readdirSync(backupsDir);
  const backups = [];

  for (const file of files) {
    if (file.endsWith('.zip')) {
      const fullPath = path.join(backupsDir, file);
      const stats = fs.statSync(fullPath);
      backups.push({
        fileName: file,
        size: formatBytes(stats.size),
        sizeBytes: stats.size,
        createdAt: stats.mtime.toISOString()
      });
    }
  }

  // Sort newest first
  return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Restore a backup ZIP
 */
export function restoreBackup(serverId, backupFileName) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const backupFilePath = path.join(serverDir, 'backups', backupFileName);

  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`Backup file ${backupFileName} not found`);
  }

  const zip = new AdmZip(backupFilePath);
  zip.extractAllTo(serverDir, true);

  commitServerChange(serverId, `Restored from backup: ${backupFileName}`, 'backup');

  return { success: true, message: `Backup ${backupFileName} restored successfully` };
}

/**
 * Delete a backup ZIP
 */
export function deleteBackup(serverId, backupFileName) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const backupFilePath = path.join(serverDir, 'backups', backupFileName);

  if (fs.existsSync(backupFilePath)) {
    fs.unlinkSync(backupFilePath);
    return { success: true };
  }
  throw new Error('Backup file not found');
}

/**
 * Reset Nether or The End dimension
 */
export function resetDimension(serverId, dimension = 'nether') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const worldDir = path.join(serverDir, 'world');

  if (dimension === 'nether') {
    const dim1Path = path.join(worldDir, 'DIM-1');
    const netherWorld = path.join(serverDir, 'world_nether');
    if (fs.existsSync(dim1Path)) fs.rmSync(dim1Path, { recursive: true, force: true });
    if (fs.existsSync(netherWorld)) fs.rmSync(netherWorld, { recursive: true, force: true });
  } else if (dimension === 'end') {
    const dimEndPath = path.join(worldDir, 'DIM1');
    const endWorld = path.join(serverDir, 'world_the_end');
    if (fs.existsSync(dimEndPath)) fs.rmSync(dimEndPath, { recursive: true, force: true });
    if (fs.existsSync(endWorld)) fs.rmSync(endWorld, { recursive: true, force: true });
  }

  commitServerChange(serverId, `Reset ${dimension} dimension`, 'world');

  return { success: true, message: `${dimension} reset completed` };
}
