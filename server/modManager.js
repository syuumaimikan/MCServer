import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { commitServerChange } from './gitManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * List installed mods / plugins in a server
 */
export function listInstalledMods(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const modsDir = path.join(serverDir, 'mods');
  const pluginsDir = path.join(serverDir, 'plugins');

  const items = [];

  // Check mods
  if (fs.existsSync(modsDir)) {
    const files = fs.readdirSync(modsDir);
    for (const file of files) {
      if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) {
        const fullPath = path.join(modsDir, file);
        const stats = fs.statSync(fullPath);
        const enabled = !file.endsWith('.disabled');
        const cleanName = file.replace(/\.jar(\.disabled)?$/, '');

        items.push({
          type: 'mod',
          fileName: file,
          name: cleanName,
          enabled,
          size: formatBytes(stats.size),
          sizeBytes: stats.size,
          updatedAt: stats.mtime.toISOString(),
          folder: 'mods'
        });
      }
    }
  }

  // Check plugins
  if (fs.existsSync(pluginsDir)) {
    const files = fs.readdirSync(pluginsDir);
    for (const file of files) {
      if (file.endsWith('.jar') || file.endsWith('.jar.disabled')) {
        const fullPath = path.join(pluginsDir, file);
        const stats = fs.statSync(fullPath);
        const enabled = !file.endsWith('.disabled');
        const cleanName = file.replace(/\.jar(\.disabled)?$/, '');

        items.push({
          type: 'plugin',
          fileName: file,
          name: cleanName,
          enabled,
          size: formatBytes(stats.size),
          sizeBytes: stats.size,
          updatedAt: stats.mtime.toISOString(),
          folder: 'plugins'
        });
      }
    }
  }

  return items;
}

/**
 * Toggle enable/disable mod
 */
export function toggleMod(serverId, fileName, folder = 'mods') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const targetDir = path.join(serverDir, folder);
  const currentPath = path.join(targetDir, fileName);

  if (!fs.existsSync(currentPath)) {
    throw new Error(`Mod file ${fileName} not found`);
  }

  let newFileName;
  if (fileName.endsWith('.disabled')) {
    newFileName = fileName.replace(/\.disabled$/, '');
  } else {
    newFileName = `${fileName}.disabled`;
  }

  const newPath = path.join(targetDir, newFileName);
  fs.renameSync(currentPath, newPath);

  const isEnabled = !newFileName.endsWith('.disabled');
  commitServerChange(serverId, `${isEnabled ? 'Enabled' : 'Disabled'} ${folder === 'plugins' ? 'plugin' : 'mod'}: ${fileName}`, 'mod');

  return { success: true, oldName: fileName, newName: newFileName, enabled: isEnabled };
}

/**
 * Delete a mod
 */
export function deleteMod(serverId, fileName, folder = 'mods') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const targetPath = path.join(serverDir, folder, fileName);

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    commitServerChange(serverId, `Deleted ${folder === 'plugins' ? 'plugin' : 'mod'}: ${fileName}`, 'mod');
    return { success: true };
  }
  throw new Error(`File ${fileName} not found`);
}

/**
 * Search Modrinth mods/plugins
 */
export async function searchModrinth({ query = '', loader = 'fabric', version = '1.21.1', limit = 20, offset = 0 }) {
  try {
    const facets = [];
    if (loader) {
      facets.push([`categories:${loader.toLowerCase()}`]);
    }
    if (version) {
      facets.push([`versions:${version}`]);
    }

    const facetsParam = encodeURIComponent(JSON.stringify(facets));
    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=${facetsParam}&limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'CraftOS-MCServer/1.0' }
    });

    if (!response.ok) {
      throw new Error(`Modrinth API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      hits: (data.hits || []).map(hit => ({
        id: hit.project_id,
        slug: hit.slug,
        title: hit.title,
        description: hit.description,
        categories: hit.categories,
        clientSide: hit.client_side,
        serverSide: hit.server_side,
        downloads: hit.downloads,
        follows: hit.follows,
        iconUrl: hit.icon_url,
        author: hit.author,
        versions: hit.versions,
        gallery: hit.gallery
      })),
      totalHits: data.total_hits || 0
    };
  } catch (err) {
    console.error('Modrinth search failed:', err.message);
    return { hits: [], totalHits: 0 };
  }
}

/**
 * Install a mod from Modrinth to a server, with auto-dependency resolution (CurseForge/Modrinth style)
 */
export async function installModrinthMod({ serverId, projectId, version = null, loader = 'fabric', targetFolder = 'mods' }) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const destDir = path.join(serverDir, targetFolder);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const existingFiles = new Set(fs.existsSync(destDir) ? fs.readdirSync(destDir).map(f => f.toLowerCase()) : []);
  const installedList = [];
  const installedDependencies = [];
  const visitedProjectIds = new Set();

  async function resolveAndInstall(pid, verId = null, isDependency = false) {
    if (visitedProjectIds.has(pid)) return null;
    visitedProjectIds.add(pid);

    let targetVersionObj = null;

    if (verId) {
      try {
        const vRes = await fetch(`https://api.modrinth.com/v2/version/${verId}`, {
          headers: { 'User-Agent': 'CraftOS-MCServer/1.0' }
        });
        if (vRes.ok) {
          targetVersionObj = await vRes.json();
        }
      } catch (e) {
        // Fallback to project lookup
      }
    }

    if (!targetVersionObj) {
      const url = `https://api.modrinth.com/v2/project/${pid}/version`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CraftOS-MCServer/1.0' }
      });
      if (!res.ok) {
        console.warn(`Could not fetch versions for ${pid}: ${res.status}`);
        return null;
      }
      const versions = await res.json();
      if (!versions || versions.length === 0) return null;

      // Find suitable version matching loader and mc version if possible
      targetVersionObj = versions.find(v => {
        const matchesLoader = !loader || (v.loaders && v.loaders.some(l => l.toLowerCase() === loader.toLowerCase()));
        const matchesMc = !version || (v.game_versions && v.game_versions.includes(version));
        return matchesLoader && matchesMc;
      });

      if (!targetVersionObj && loader) {
        targetVersionObj = versions.find(v => v.loaders && v.loaders.some(l => l.toLowerCase() === loader.toLowerCase()));
      }

      if (!targetVersionObj) {
        targetVersionObj = versions[0];
      }
    }

    if (!targetVersionObj) return null;

    const primaryFile = targetVersionObj.files.find(f => f.primary) || targetVersionObj.files[0];
    if (!primaryFile || !primaryFile.url) return null;

    const fileName = primaryFile.filename;
    const destPath = path.join(destDir, fileName);

    const isAlreadyInstalled = existingFiles.has(fileName.toLowerCase()) ||
      Array.from(existingFiles).some(f => f.replace(/\.disabled$/, '') === fileName.toLowerCase());

    if (!isAlreadyInstalled) {
      const fileRes = await fetch(primaryFile.url, {
        headers: { 'User-Agent': 'CraftOS-MCServer/1.0' }
      });
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
        existingFiles.add(fileName.toLowerCase());
      }
    }

    const modInfo = {
      projectId: pid,
      name: targetVersionObj.name || fileName,
      fileName,
      versionNumber: targetVersionObj.version_number,
      isDependency
    };

    if (isDependency) {
      installedDependencies.push(targetVersionObj.name || fileName);
    } else {
      installedList.push(modInfo);
    }

    // Recursively resolve required dependencies (CurseForge / Modrinth style)
    if (Array.isArray(targetVersionObj.dependencies) && targetVersionObj.dependencies.length > 0) {
      for (const dep of targetVersionObj.dependencies) {
        if (dep.dependency_type === 'required') {
          try {
            if (dep.project_id && !visitedProjectIds.has(dep.project_id)) {
              await resolveAndInstall(dep.project_id, dep.version_id, true);
            } else if (dep.version_id) {
              await resolveAndInstall(dep.version_id, dep.version_id, true);
            }
          } catch (depErr) {
            console.warn(`Failed to resolve dependency ${dep.project_id || dep.version_id}:`, depErr.message);
          }
        }
      }
    }

    return modInfo;
  }

  const mainMod = await resolveAndInstall(projectId, null, false);
  if (!mainMod) {
    throw new Error('適合するバージョンのModファイルが見つかりませんでした');
  }

  commitServerChange(
    serverId,
    `Installed ${targetFolder === 'plugins' ? 'plugin' : 'mod'}: ${mainMod.name}${
      installedDependencies.length > 0 ? ` (+${installedDependencies.length} 前提Mod)` : ''
    }`,
    'mod'
  );

  return {
    success: true,
    fileName: mainMod.fileName,
    name: mainMod.name,
    versionNumber: mainMod.versionNumber,
    dependenciesInstalled: installedDependencies
  };
}

/**
 * Save an uploaded mod jar buffer
 */
export function saveUploadedMod(serverId, fileName, buffer, folder = 'mods') {
  const serverDir = path.join(SERVERS_DIR, serverId);
  const targetDir = path.join(serverDir, folder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = path.join(targetDir, safeFileName);
  fs.writeFileSync(targetPath, buffer);

  commitServerChange(serverId, `Uploaded ${folder === 'plugins' ? 'plugin' : 'mod'}: ${safeFileName}`, 'mod');

  return { success: true, fileName: safeFileName };
}
