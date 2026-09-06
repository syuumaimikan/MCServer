import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { getCraftosConfig } from './configManager.js';
import { listInstalledMods } from './modManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

/**
 * Creates a downloadable Client Modpack ZIP archive stream
 */
export function createClientModpackZip(serverId, res) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server ${serverId} not found`);
  }

  const config = getCraftosConfig(serverId);
  const modsDir = path.join(serverDir, 'mods');

  const archive = archiver('zip', { zlib: { level: 9 } });

  const safeName = (config.name || serverId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const zipFileName = `${safeName}-client-mods-${config.version}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);

  archive.pipe(res);

  // Add all enabled client/server mods in mods/ folder
  if (fs.existsSync(modsDir)) {
    const files = fs.readdirSync(modsDir);
    for (const file of files) {
      if (file.endsWith('.jar') && !file.endsWith('.disabled')) {
        const filePath = path.join(modsDir, file);
        // Put directly under mods/ in ZIP
        archive.file(filePath, { name: `mods/${file}` });
      }
    }
  }

  // Add README text for the player
  const readmeText = [
    `========================================================`,
    `  ${config.name || serverId} - クライアント用 Mod パック`,
    `========================================================`,
    ``,
    `【Minecraft バージョン】: ${config.version}`,
    `【Mod ローダー】: ${config.type.toUpperCase()}`,
    ``,
    `【導入手順 (公式ランチャー / 誰でも簡単)】:`,
    `1. Minecraft Launcher を開き、${config.type.toUpperCase()} ${config.version} のプロファイルを起動します。`,
    `2. Windows の [Win + R] キーを押し、%appdata%\\.minecraft を開きます。`,
    `3. この ZIP 内の「mods」フォルダの中身を、上記の .minecraft\\mods フォルダへそのままコピーしてください。`,
    `4. ゲームを起動し、サーバーへ接続してください！`,
    ``,
    `CraftOS Modpack Exporter により自動生成されました。`
  ].join('\r\n');

  archive.append(readmeText, { name: '導入方法_お読みください.txt' });

  // Add Modrinth format index metadata if applicable
  const modpackIndex = {
    game: 'minecraft',
    formatVersion: 1,
    versionId: '1.0.0',
    name: `${config.name} Modpack`,
    summary: `Client modpack for ${config.name} (${config.version} ${config.type})`,
    dependencies: {
      minecraft: config.version,
      'fabric-loader': '0.16.10'
    },
    files: []
  };
  archive.append(JSON.stringify(modpackIndex, null, 2), { name: 'modpack.index.json' });

  archive.finalize();
}

/**
 * Get Client Modpack summary info and share guide text
 */
export function getModpackShareInfo(serverId, host = 'localhost:3001') {
  const config = getCraftosConfig(serverId);
  const installedMods = listInstalledMods(serverId);
  const enabledMods = installedMods.filter(m => m.enabled && m.type === 'mod');

  const downloadUrl = `http://${host}/api/servers/${serverId}/download-client-pack`;

  const shareText = [
    `📦 【${config.name} 専用 Modパック 配布案内】`,
    `Minecraft バージョン: ${config.version} (${config.type.toUpperCase()})`,
    `導入Mod数: ${enabledMods.length} 個`,
    ``,
    `📥 【ワンクリック ダウンロードURL】:`,
    downloadUrl,
    ``,
    `💡 【導入手順】:`,
    `① 上記リンクから ZIP をダウンロードして解凍`,
    `② 「mods」フォルダの中身を自分の .minecraft/mods に入れるだけ！`,
    `③ 準備ができたらサーバーへ参加してね！`
  ].join('\n');

  return {
    serverName: config.name,
    version: config.version,
    loader: config.type,
    modCount: enabledMods.length,
    mods: enabledMods.map(m => m.name),
    downloadUrl,
    shareText
  };
}
