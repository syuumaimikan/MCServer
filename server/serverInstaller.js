import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { initServerGit } from './gitManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

// Ensure servers directory exists
if (!fs.existsSync(SERVERS_DIR)) {
  fs.mkdirSync(SERVERS_DIR, { recursive: true });
}

/**
 * Downloads a file with progress reporting
 */
async function downloadFile(url, destPath, onProgress) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CraftOS-MCServer/1.0' }
  });

  if (!response.ok) {
    throw new Error(`Failed to download from ${url}: ${response.status} ${response.statusText}`);
  }

  const totalBytes = Number(response.headers.get('content-length')) || 0;
  let receivedBytes = 0;

  const fileStream = fs.createWriteStream(destPath);
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    receivedBytes += value.length;
    fileStream.write(Buffer.from(value));

    if (onProgress && totalBytes > 0) {
      const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
      onProgress(percent, receivedBytes, totalBytes);
    }
  }

  await new Promise((resolve, reject) => {
    fileStream.end(resolve);
    fileStream.on('error', reject);
  });
}

/**
 * Get available Minecraft versions for different server types
 */
export async function getAvailableVersions(type = 'fabric') {
  try {
    switch (type.toLowerCase()) {
      case 'fabric': {
        const res = await fetch('https://meta.fabricmc.net/v2/versions/game');
        const data = await res.json();
        return data
          .filter(v => v.stable)
          .map(v => ({
            version: v.version,
            stable: v.stable,
            type: 'release'
          }))
          .slice(0, 30);
      }
      case 'paper': {
        const res = await fetch('https://fill.papermc.io/v3/projects/paper');
        const data = await res.json();
        const versions = [];
        if (data && data.versions) {
          for (const [major, subVersions] of Object.entries(data.versions)) {
            if (Array.isArray(subVersions)) {
              for (const v of subVersions) {
                if (!v.includes('pre') && !v.includes('rc')) {
                  versions.push({ version: v, stable: true, type: 'release' });
                }
              }
            }
          }
        }
        return versions.slice(0, 30);
      }
      case 'purpur': {
        const res = await fetch('https://api.purpurmc.org/v2/purpur');
        const data = await res.json();
        if (data && data.versions) {
          return data.versions.reverse().slice(0, 30).map(v => ({
            version: v,
            stable: true,
            type: 'release'
          }));
        }
        return [];
      }
      case 'vanilla': {
        const res = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
        const data = await res.json();
        return data.versions
          .filter(v => v.type === 'release')
          .slice(0, 30)
          .map(v => ({
            version: v.id,
            stable: true,
            type: v.type,
            url: v.url
          }));
      }
      case 'neoforge': {
        return [
          { version: '1.21.4', stable: true, type: 'release' },
          { version: '1.21.3', stable: true, type: 'release' },
          { version: '1.21.1', stable: true, type: 'release' },
          { version: '1.20.6', stable: true, type: 'release' },
          { version: '1.20.4', stable: true, type: 'release' },
        ];
      }
      case 'forge': {
        return [
          { version: '1.20.1', stable: true, type: 'release' },
          { version: '1.19.4', stable: true, type: 'release' },
          { version: '1.19.2', stable: true, type: 'release' },
          { version: '1.18.2', stable: true, type: 'release' },
          { version: '1.16.5', stable: true, type: 'release' },
          { version: '1.12.2', stable: true, type: 'release' },
        ];
      }
      default:
        return [];
    }
  } catch (err) {
    console.error(`Error fetching versions for ${type}:`, err.message);
    return [
      { version: '1.21.4', stable: true, type: 'release' },
      { version: '1.21.1', stable: true, type: 'release' },
      { version: '1.20.4', stable: true, type: 'release' },
      { version: '1.20.1', stable: true, type: 'release' },
      { version: '1.19.4', stable: true, type: 'release' },
      { version: '1.16.5', stable: true, type: 'release' },
    ];
  }
}

/**
 * Creates and sets up a new Minecraft server
 */
export async function createServer({
  id,
  name,
  type = 'fabric',
  version = '1.21.1',
  ram = 4, // in GB
  port = 25565,
  motd = 'A Minecraft Server managed by CraftOS',
  autoEula = true,
  onProgress = () => {}
}) {
  const safeId = id || name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_' + Date.now().toString().slice(-4);
  const serverDir = path.join(SERVERS_DIR, safeId);

  if (fs.existsSync(serverDir)) {
    throw new Error(`Server folder already exists: ${safeId}`);
  }

  fs.mkdirSync(serverDir, { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'mods'), { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'plugins'), { recursive: true });
  fs.mkdirSync(path.join(serverDir, 'backups'), { recursive: true });

  onProgress({ stage: 'downloading', message: `Downloading ${type.toUpperCase()} ${version} server binary...`, percent: 10 });

  let serverJarName = 'server.jar';

  try {
    if (type.toLowerCase() === 'fabric') {
      // Get latest fabric loader & installer
      const loaderRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${version}`);
      const loaderData = await loaderRes.json();
      const loaderVersion = loaderData[0]?.loader?.version || '0.16.10';

      const installerRes = await fetch('https://meta.fabricmc.net/v2/versions/installer');
      const installerData = await installerRes.json();
      const installerVersion = installerData[0]?.version || '1.0.1';

      const downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVersion}/${installerVersion}/server/jar`;
      const targetJar = path.join(serverDir, 'server.jar');

      await downloadFile(downloadUrl, targetJar, (percent) => {
        onProgress({ stage: 'downloading', message: `Downloading Fabric server jar... (${percent}%)`, percent: 10 + Math.round(percent * 0.7) });
      });

    } else if (type.toLowerCase() === 'paper') {
      const versionRes = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}`);
      const versionData = await versionRes.json();
      
      if (!versionData || !versionData.builds || versionData.builds.length === 0) {
        throw new Error(`No Paper builds available for Minecraft ${version}`);
      }

      const latestBuild = versionData.builds[0];
      const buildRes = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds/${latestBuild}`);
      const buildData = await buildRes.json();

      const defaultDownload = buildData.downloads && (buildData.downloads['server:default'] || buildData.downloads['application']);
      if (!defaultDownload || !defaultDownload.url) {
        throw new Error(`Could not find download URL for Paper ${version} build ${latestBuild}`);
      }

      const targetJar = path.join(serverDir, 'server.jar');
      await downloadFile(defaultDownload.url, targetJar, (percent) => {
        onProgress({ stage: 'downloading', message: `Downloading Paper build #${latestBuild}... (${percent}%)`, percent: 10 + Math.round(percent * 0.7) });
      });

    } else if (type.toLowerCase() === 'purpur') {
      const purpurUrl = `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
      const targetJar = path.join(serverDir, 'server.jar');
      await downloadFile(purpurUrl, targetJar, (percent) => {
        onProgress({ stage: 'downloading', message: `Downloading Purpur jar... (${percent}%)`, percent: 10 + Math.round(percent * 0.7) });
      });

    } else if (type.toLowerCase() === 'vanilla') {
      const manifestRes = await fetch('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json');
      const manifest = await manifestRes.json();
      const versionMeta = manifest.versions.find(v => v.id === version);
      if (!versionMeta) {
        throw new Error(`Mojang version metadata not found for ${version}`);
      }

      const metaRes = await fetch(versionMeta.url);
      const meta = await metaRes.json();
      const serverDownloadUrl = meta.downloads?.server?.url;

      if (!serverDownloadUrl) {
        throw new Error(`Official server.jar not found for ${version}`);
      }

      const targetJar = path.join(serverDir, 'server.jar');
      await downloadFile(serverDownloadUrl, targetJar, (percent) => {
        onProgress({ stage: 'downloading', message: `Downloading Vanilla server.jar... (${percent}%)`, percent: 10 + Math.round(percent * 0.7) });
      });

    } else if (type.toLowerCase() === 'neoforge') {
      // NeoForge standard installer
      const neoVersion = version.startsWith('1.20.4') ? '20.4.167' : (version.startsWith('1.21.1') ? '21.1.77' : version);
      const installerUrl = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`;
      const targetJar = path.join(serverDir, 'server.jar');
      await downloadFile(installerUrl, targetJar, (percent) => {
        onProgress({ stage: 'downloading', message: `Downloading NeoForge installer... (${percent}%)`, percent: 10 + Math.round(percent * 0.7) });
      });
    }

    onProgress({ stage: 'configuring', message: 'Generating server configuration & EULA...', percent: 85 });

    // Write EULA
    if (autoEula) {
      fs.writeFileSync(path.join(serverDir, 'eula.txt'), `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n#${new Date().toISOString()}\neula=true\n`);
    }

    // Write server.properties
    const serverProperties = [
      `#Minecraft server properties`,
      `#Auto-generated by CraftOS`,
      `server-port=${port}`,
      `motd=${motd}`,
      `difficulty=easy`,
      `gamemode=survival`,
      `pvp=true`,
      `max-players=20`,
      `online-mode=true`,
      `enable-command-block=true`,
      `view-distance=10`,
      `simulation-distance=8`,
      `allow-flight=true`,
      `white-list=false`,
      `level-name=world`,
      `sync-chunk-writes=true`,
      `network-compression-threshold=256`
    ].join('\n');

    fs.writeFileSync(path.join(serverDir, 'server.properties'), serverProperties);

    // Write CraftOS server configuration metadata
    const craftosConfig = {
      id: safeId,
      name: name || safeId,
      type: type.toLowerCase(),
      version: version,
      ram: Number(ram) || 4,
      port: Number(port) || 25565,
      serverJar: serverJarName,
      javaPath: 'java',
      aikarFlags: true,
      autoRestart: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(path.join(serverDir, 'craftos-config.json'), JSON.stringify(craftosConfig, null, 2));

    // Initialize Git repository & create initial commit
    try {
      initServerGit(safeId);
    } catch (_) {}

    onProgress({ stage: 'completed', message: 'Server successfully created!', percent: 100 });

    return craftosConfig;
  } catch (err) {
    // Cleanup on failure
    try {
      if (fs.existsSync(serverDir)) {
        fs.rmSync(serverDir, { recursive: true, force: true });
      }
    } catch (_) {}
    throw err;
  }
}

/**
 * List all existing servers
 */
export function listServers() {
  if (!fs.existsSync(SERVERS_DIR)) return [];
  const entries = fs.readdirSync(SERVERS_DIR, { withFileTypes: true });
  const servers = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const configPath = path.join(SERVERS_DIR, entry.name, 'craftos-config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          servers.push(config);
        } catch (_) {}
      } else {
        // Fallback for folders without craftos-config
        servers.push({
          id: entry.name,
          name: entry.name,
          type: 'unknown',
          version: 'custom',
          ram: 4,
          port: 25565,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return servers;
}

/**
 * Delete a server
 */
export function deleteServer(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (fs.existsSync(serverDir)) {
    fs.rmSync(serverDir, { recursive: true, force: true });
    return true;
  }
  return false;
}
