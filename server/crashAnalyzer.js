import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toggleMod } from './modManager.js';
import { getCraftosConfig, saveCraftosConfig } from './configManager.js';
import { commitServerChange } from './gitManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

/**
 * Known Minecraft Crash Patterns & Solutions Database
 */
const CRASH_RULES = [
  {
    id: 'eula_not_agreed',
    pattern: /You need to agree to the EULA in order to run the server|Failed to load eula\.txt/i,
    title: '📜 EULA（利用規約）未同意',
    severity: 'high',
    category: 'configuration',
    explanation: 'Minecraftサーバーの利用規約（EULA）に同意していません。サーバー起動が即座に中断されました。',
    solution: 'eula.txt 内の eula=false を eula=true に変更してください。',
    repairAction: 'fix_eula',
    repairLabel: 'EULAに自動同意して修復'
  },
  {
    id: 'port_already_in_use',
    pattern: /FAILED TO BIND TO PORT|Address already in use: bind|java\.net\.BindException/i,
    title: '🔌 ポート重複衝突（Address already in use）',
    severity: 'critical',
    category: 'network',
    explanation: '指定されたポート（例: 25565）が既に別のMinecraftサーバーやアプリケーションで使用されているため起動できません。',
    solution: '別のCraftOSサーバーが起動中ではないか確認するか、サーバーのポート番号を 25566 などに変更してください。',
    repairAction: 'change_port',
    repairLabel: 'ポートを +1（空きポート）に変更'
  },
  {
    id: 'out_of_memory',
    pattern: /java\.lang\.OutOfMemoryError|There is insufficient memory for the Java Runtime Environment/i,
    title: '⚠️ メモリ不足（Out of Memory）',
    severity: 'critical',
    category: 'memory',
    explanation: 'Minecraftサーバーに割り当てられたRAM（メモリ）が枯渇しました。大規模Modパックや大人数プレイで発生します。',
    solution: 'サーバー設定から割り当てメモリ（RAM）を 2GB〜4GB 程度増やしてください。またFerriteCoreなどの軽量化Modを導入してください。',
    repairAction: 'increase_ram',
    repairLabel: '割り当てメモリを +2GB 増量'
  },
  {
    id: 'java_version_mismatch',
    pattern: /has been compiled by a more recent version of the Java Runtime \(class file version (\d+)\)|UnsupportedClassVersionError/i,
    title: '☕ Java バージョン非互換（Java Version Mismatch）',
    severity: 'critical',
    category: 'java',
    explanation: 'MinecraftやModが要求するJavaバージョンと、PCにインストールされているJavaのバージョンが一致していません。',
    solution: 'Minecraft 1.20.5以降は Java 21 が必須です。適切なJavaランタイムをインストールし、設定で指定してください。',
    repairAction: 'guide_java',
    repairLabel: 'Java 21 ダウンロード手順を確認'
  },
  {
    id: 'mixin_apply_failed',
    pattern: /org\.spongepowered\.asm\.mixin\.transformer\.throwables\.MixinTransformerError|Mixin apply failed for/i,
    title: '💥 Mod Mixin 適用エラー（Mod競合）',
    severity: 'critical',
    category: 'mod_conflict',
    explanation: '特定のModがゲームの内部コード（Mixin）を書き換える際に、別のModとの競合やバージョン不一致で失敗しました。',
    solution: 'クラッシュログに記載された対象Modを特定し、最新版に更新するか一時的に無効化してください。',
    repairAction: 'disable_culprit_mod',
    repairLabel: '原因Modをワンクリック無効化'
  },
  {
    id: 'missing_dependency',
    pattern: /Mod '([^']+)' \(([^\)]+)\) requires .* which is missing/i,
    title: '🧩 前提Mod（Dependency）の不足',
    severity: 'high',
    category: 'mod_dependency',
    explanation: '導入したModが動作するために必要な「前提Mod（Fabric APIやArchitectury等）」が不足しています。',
    solution: '不足している前提ModをModrinthストアから追加インストールしてください。',
    repairAction: 'install_fabric_api',
    repairLabel: 'Fabric API を自動インストール'
  }
];

/**
 * Extract culprit mod name from stacktrace or log lines
 */
function detectCulpritMod(logContent, serverDir) {
  const modsDir = path.join(serverDir, 'mods');
  if (!fs.existsSync(modsDir)) return null;

  const installedModFiles = fs.readdirSync(modsDir).filter(f => f.endsWith('.jar'));

  // 1. Search for direct mod ID mentions
  for (const file of installedModFiles) {
    const rawName = file.replace(/\.jar$/, '').toLowerCase();
    const parts = rawName.split(/[-_]/);
    const mainIdentifier = parts[0];

    if (mainIdentifier.length > 2 && logContent.toLowerCase().includes(mainIdentifier)) {
      // Check if mentioned in stacktrace
      const isStacktraceMention = logContent.toLowerCase().includes(`net.minecraft`) || logContent.toLowerCase().includes(mainIdentifier);
      if (isStacktraceMention) {
        return {
          fileName: file,
          name: rawName,
          confidence: 'high'
        };
      }
    }
  }

  // 2. Check for Fabric Loader ModContainer lines
  const modContainerMatch = logContent.match(/Could not execute entrypoint stage '.*' due to errors, provided by '([^']+)'/i);
  if (modContainerMatch) {
    const modId = modContainerMatch[1];
    const matchingFile = installedModFiles.find(f => f.toLowerCase().includes(modId.toLowerCase()));
    return {
      fileName: matchingFile || `${modId}.jar`,
      name: modId,
      confidence: 'very_high'
    };
  }

  return null;
}

/**
 * Analyzes latest crash report or log for a server
 */
export function analyzeServerCrash(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server ${serverId} not found`);
  }

  const crashReportsDir = path.join(serverDir, 'crash-reports');
  const logsDir = path.join(serverDir, 'logs');
  const latestLogPath = path.join(logsDir, 'latest.log');

  let rawLog = '';
  let source = 'none';
  let timestamp = null;

  // 1. Check crash-reports first
  if (fs.existsSync(crashReportsDir)) {
    const reports = fs.readdirSync(crashReportsDir)
      .filter(f => f.startsWith('crash-') && f.endsWith('.txt'))
      .map(f => ({
        name: f,
        path: path.join(crashReportsDir, f),
        mtime: fs.statSync(path.join(crashReportsDir, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (reports.length > 0) {
      const latestReport = reports[0];
      rawLog = fs.readFileSync(latestReport.path, 'utf8');
      source = `crash-reports/${latestReport.name}`;
      timestamp = latestReport.mtime.toISOString();
    }
  }

  // 2. Fallback to latest.log if no crash report or it's old
  if (!rawLog && fs.existsSync(latestLogPath)) {
    rawLog = fs.readFileSync(latestLogPath, 'utf8');
    source = 'logs/latest.log';
    timestamp = fs.statSync(latestLogPath).mtime.toISOString();
  }

  if (!rawLog) {
    return {
      hasCrash: false,
      message: 'クラッシュログまたはレポートは見つかりませんでした。正常稼働または未起動です。'
    };
  }

  // Extract stacktrace snippet
  const lines = rawLog.split(/\r?\n/);
  const errorLines = lines.filter(l => l.includes('ERROR') || l.includes('Exception') || l.includes('Error') || l.includes('FATAL'));
  const snippet = lines.slice(-40).join('\n');

  // Match against known rules
  let matchedIssue = null;
  for (const rule of CRASH_RULES) {
    if (rule.pattern.test(rawLog)) {
      matchedIssue = rule;
      break;
    }
  }

  // Detect culprit mod
  const culpritMod = detectCulpritMod(rawLog, serverDir);

  // If no matched rule but error lines exist
  if (!matchedIssue && errorLines.length > 0) {
    matchedIssue = {
      id: 'general_exception',
      title: '⚠️ 予期しないサーバーエラー / クラッシュ',
      severity: 'high',
      category: 'general',
      explanation: 'スタックトレースまたはログに重大な例外（Exception）が記録されました。',
      solution: 'スタックトレースを確認し、該当するModの削除またはTime Machineからの復元をお試しください。',
      repairAction: culpritMod ? 'disable_culprit_mod' : 'rollback_snapshot',
      repairLabel: culpritMod ? `原因の可能性が高い Mod「${culpritMod.fileName}」を無効化` : 'Time Machineで直前の安定版に戻す'
    };
  }

  return {
    hasCrash: !!matchedIssue,
    source,
    timestamp,
    issue: matchedIssue,
    culpritMod,
    errorSummary: errorLines.slice(0, 5),
    snippet
  };
}

/**
 * Execute one-click auto-repair action
 */
export async function executeCrashRepair(serverId, repairAction, payload = {}) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) throw new Error('Server not found');

  switch (repairAction) {
    case 'fix_eula': {
      const eulaPath = path.join(serverDir, 'eula.txt');
      fs.writeFileSync(eulaPath, `#By changing the setting below to TRUE you are indicating your agreement to our EULA (https://aka.ms/MinecraftEULA).\n#${new Date().toISOString()}\neula=true\n`, 'utf8');
      commitServerChange(serverId, 'Auto-fixed EULA agreement via Crash Doctor', 'doctor');
      return { success: true, message: 'EULAを「同意 (eula=true)」に自動修復しました。サーバーを起動できます。' };
    }

    case 'increase_ram': {
      const config = getCraftosConfig(serverId);
      config.ram = (Number(config.ram) || 4) + 2;
      saveCraftosConfig(serverId, config);
      commitServerChange(serverId, `Increased RAM to ${config.ram}GB via Crash Doctor`, 'doctor');
      return { success: true, message: `サーバーの割り当てメモリを ${config.ram}GB に増量しました。` };
    }

    case 'change_port': {
      const config = getCraftosConfig(serverId);
      const propPath = path.join(serverDir, 'server.properties');
      let currentPort = config.port || 25565;
      let newPort = currentPort + 1;

      config.port = newPort;
      saveCraftosConfig(serverId, config);

      if (fs.existsSync(propPath)) {
        let content = fs.readFileSync(propPath, 'utf8');
        content = content.replace(/server-port=\d+/, `server-port=${newPort}`);
        fs.writeFileSync(propPath, content, 'utf8');
      }

      commitServerChange(serverId, `Changed server port to ${newPort} to avoid collision`, 'doctor');
      return { success: true, message: `ポートを ${newPort} に変更して重複を解消しました。` };
    }

    case 'disable_culprit_mod': {
      const fileName = payload.fileName;
      if (!fileName) throw new Error('Mod fileName not provided');
      const result = toggleMod(serverId, fileName, 'mods');
      commitServerChange(serverId, `Disabled culprit mod: ${fileName} via Crash Doctor`, 'doctor');
      return { success: true, message: `クラッシュ原因のMod「${fileName}」を無効化しました。` };
    }

    default:
      throw new Error(`Unknown repair action: ${repairAction}`);
  }
}
