import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installModrinthMod, listInstalledMods } from './modManager.js';
import { commitServerChange } from './gitManager.js';
import { getCraftosConfig, saveCraftosConfig } from './configManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVERS_DIR = path.resolve(__dirname, '../servers');

// Curated top-tier performance mods available on Modrinth
export const RECOMMENDED_PERFORMANCE_MODS = [
  {
    id: 'lithium',
    name: 'Lithium',
    author: 'CaffeineMC',
    description: '物理演算、チャンクローディング、AI、ホッパー等のサーバー処理を根本から最適化しTPSを大幅向上させる必須Mod。',
    category: 'TPS & Physics',
    recommendedFor: ['fabric', 'neoforge'],
    impact: '★★★★★ (TPS最大向上)',
    slug: 'lithium'
  },
  {
    id: 'ferrite-core',
    name: 'FerriteCore',
    author: 'malte0811',
    description: 'メモリデータ構造を再設計し、RAM消費量を30%〜50%削減。サーバーのクラッシュやGCスパイクを予防。',
    category: 'Memory (RAM)',
    recommendedFor: ['fabric', 'forge', 'neoforge'],
    impact: '★★★★★ (RAM半減)',
    slug: 'ferrite-core'
  },
  {
    id: 'krypton',
    name: 'Krypton',
    author: 'astei',
    description: 'Nettyスタックとネットワークパケットパイプラインを最適化。マルチプレイ時のパケット遅延と帯域負荷を軽減。',
    category: 'Network & Ping',
    recommendedFor: ['fabric'],
    impact: '★★★★☆ (Ping改善)',
    slug: 'krypton'
  },
  {
    id: 'modernfix',
    name: 'ModernFix',
    author: 'embeddedt',
    description: 'サーバー起動時間を劇的に短縮し、各種メモリリークを自動修復する万能高速化Mod。',
    category: 'Startup & Stability',
    recommendedFor: ['fabric', 'forge', 'neoforge'],
    impact: '★★★★☆ (起動高速化)',
    slug: 'modernfix'
  },
  {
    id: 'spark',
    name: 'Spark Profiler',
    author: 'lucko',
    description: 'サーバーラグの原因（特定のMob、重いRedstone回路、Mod処理）をリアルタイムで特定できる公式級プロファイラ。',
    category: 'Diagnostics & Profiler',
    recommendedFor: ['fabric', 'forge', 'neoforge', 'paper', 'purpur'],
    impact: '★★★★☆ (ラグ診断)',
    slug: 'spark'
  },
  {
    id: 'chunky',
    name: 'Chunky (Pre-generator)',
    author: 'pop4959',
    description: 'プレイヤー探索前のワールドチャンク事前生成ツール。走行中やエリトラ飛行時のチャンク生成ラグを完全解消。',
    category: 'World Generation',
    recommendedFor: ['fabric', 'forge', 'neoforge', 'paper', 'purpur'],
    impact: '★★★★★ (生成ラグ撲滅)',
    slug: 'chunky'
  }
];

export const GC_PRESETS = [
  {
    id: 'aikar',
    name: "Aikar's G1GC Flags (推奨・標準)",
    description: 'Minecraftサーバー運用で最も検証され、安定した最高峰のG1GC設定。GCによるTPSドロップ（ラグスパイク）を徹底的に抑えます。',
    recommendedRam: '4GB - 16GB',
    flags: [
      '-XX:+UseG1GC',
      '-XX:+ParallelRefProcEnabled',
      '-XX:MaxGCPauseMillis=200',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:+DisableExplicitGC',
      '-XX:+AlwaysPreTouch',
      '-XX:G1NewSizePercent=30',
      '-XX:G1MaxNewSizePercent=40',
      '-XX:G1ReservePercent=20',
      '-XX:G1HeapWastePercent=5',
      '-XX:G1MixedGCCountTarget=4',
      '-XX:InitiatingHeapOccupancyPercent=15',
      '-XX:G1MixedGCLiveThresholdPercent=90',
      '-XX:G1RSetUpdatingPauseTimePercent=5',
      '-XX:SurvivorRatio=32',
      '-XX:+PerfDisableSharedMem',
      '-XX:MaxTenuringThreshold=1',
      '-Dusing.aikars.flags=https://mcflags.emc.gs',
      '-Daikars.new.flags=true'
    ]
  },
  {
    id: 'shenandoah',
    name: 'Shenandoah Ultra-Low Latency GC',
    description: 'ガベージコレクションをアプリケーションと並行して実行し、数ミリ秒以下の極小停止時間を実現する最先端GC（Java 17/21対応）。',
    recommendedRam: '6GB - 32GB',
    flags: [
      '-XX:+UseShenandoahGC',
      '-XX:+UnlockExperimentalVMOptions',
      '-XX:ShenandoahGCMode=iu',
      '-XX:ShenandoahGCHeuristics=adaptive',
      '-XX:+AlwaysPreTouch',
      '-XX:+DisableExplicitGC'
    ]
  },
  {
    id: 'zgc',
    name: 'Generational ZGC (Java 21+)',
    description: 'テラバイト規模でも1ミリ秒未満のポーズ時間を実現するOracle次世代GC。大容量RAMサーバーに最適。',
    recommendedRam: '8GB - 32GB+',
    flags: [
      '-XX:+UseZGC',
      '-XX:+ZGenerational',
      '-XX:+AlwaysPreTouch',
      '-XX:+DisableExplicitGC'
    ]
  },
  {
    id: 'low_memory',
    name: 'Low Memory Budget (軽量・省メモリ)',
    description: '2GB〜3GB程度の限られたRAM環境向け。不要なJVMキャッシュを削りメモリ枯渇クラッシュを防ぎます。',
    recommendedRam: '2GB - 4GB',
    flags: [
      '-XX:+UseG1GC',
      '-XX:MaxGCPauseMillis=300',
      '-XX:G1NewSizePercent=20',
      '-XX:G1ReservePercent=10',
      '-XX:+DisableExplicitGC'
    ]
  }
];

/**
 * Get Optimization Status for a server
 */
export function getOptimizationStatus(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) {
    throw new Error(`Server ${serverId} not found`);
  }

  const config = getCraftosConfig(serverId);
  const installedMods = listInstalledMods(serverId);
  const installedModSlugs = new Set(
    installedMods.map(m => m.name.toLowerCase().replace(/[-_].*$/, ''))
  );

  const modStatus = RECOMMENDED_PERFORMANCE_MODS.map(item => {
    // Check if installed
    const isInstalled = installedMods.some(m => 
      m.name.toLowerCase().includes(item.id) || 
      m.name.toLowerCase().includes(item.slug)
    );
    const isApplicable = item.recommendedFor.includes(config.type);

    return {
      ...item,
      installed: isInstalled,
      applicable: isApplicable
    };
  });

  // Calculate optimization score (0 - 100)
  let score = 50;
  if (config.gcPreset || config.aikarFlags) score += 20;

  const applicableMods = modStatus.filter(m => m.applicable);
  if (applicableMods.length > 0) {
    const installedCount = applicableMods.filter(m => m.installed).length;
    score += Math.round((installedCount / applicableMods.length) * 30);
  } else {
    score += 30; // Paper/Purpur already has built-in optimizations
  }

  return {
    score: Math.min(100, score),
    serverType: config.type,
    version: config.version,
    currentGCPreset: config.gcPreset || (config.aikarFlags ? 'aikar' : 'standard'),
    gcPresets: GC_PRESETS,
    mods: modStatus,
    paperOptimized: config.paperOptimized || false
  };
}

/**
 * Install all applicable recommended performance mods in one click
 */
export async function installPerformanceMods(serverId, selectedModIds = []) {
  const config = getCraftosConfig(serverId);
  const serverType = config.type;
  const version = config.version;

  const targetMods = RECOMMENDED_PERFORMANCE_MODS.filter(m => {
    if (selectedModIds.length > 0) {
      return selectedModIds.includes(m.id) && m.recommendedFor.includes(serverType);
    }
    return m.recommendedFor.includes(serverType);
  });

  const results = [];

  for (const mod of targetMods) {
    try {
      const loader = serverType === 'paper' || serverType === 'purpur' ? 'paper' : serverType;
      const targetFolder = serverType === 'paper' || serverType === 'purpur' ? 'plugins' : 'mods';

      const res = await installModrinthMod({
        serverId,
        projectId: mod.slug,
        version,
        loader,
        targetFolder
      });

      results.push({ id: mod.id, name: mod.name, success: true, file: res.fileName });
    } catch (err) {
      results.push({ id: mod.id, name: mod.name, success: false, error: err.message });
    }
  }

  commitServerChange(serverId, `Installed performance mods: ${results.filter(r => r.success).map(r => r.name).join(', ')}`, 'optimizer');

  return {
    success: true,
    results,
    installedCount: results.filter(r => r.success).length
  };
}

/**
 * Apply Paper / Purpur / Spigot Server Performance Tweaks
 */
export function applyPaperOptimizations(serverId) {
  const serverDir = path.join(SERVERS_DIR, serverId);
  if (!fs.existsSync(serverDir)) throw new Error('Server not found');

  // 1. Optimize spigot.yml if exists or create
  const spigotPath = path.join(serverDir, 'spigot.yml');
  const spigotContent = [
    '# Optimized by CraftOS Performance Engine',
    'world-settings:',
    '  default:',
    '    view-distance: default',
    '    simulation-distance: default',
    '    item-despawn-rate: 4000',
    '    merge-radius:',
    '      item: 4.0',
    '      exp: 6.0',
    '    entity-activation-range:',
    '      animals: 16',
    '      monsters: 24',
    '      raiders: 32',
    '      misc: 8',
    '      water: 12',
    '      villagers: 16',
    '    tick-inactive-villagers: false',
    '    entity-tracking-range:',
    '      players: 48',
    '      animals: 32',
    '      monsters: 32',
    '      misc: 16',
    '      other: 48'
  ].join('\n');
  fs.writeFileSync(spigotPath, spigotContent, 'utf8');

  // Update craftos config
  const config = getCraftosConfig(serverId);
  config.paperOptimized = true;
  saveCraftosConfig(serverId, config);

  commitServerChange(serverId, 'Applied Paper/Spigot high-performance config tweaks', 'optimizer');

  return { success: true, message: 'Applied optimal server settings' };
}

/**
 * Set GC Preset for the server
 */
export function setServerGCPreset(serverId, presetId) {
  const preset = GC_PRESETS.find(p => p.id === presetId);
  if (!preset && presetId !== 'standard') {
    throw new Error(`Invalid GC Preset: ${presetId}`);
  }

  const config = getCraftosConfig(serverId);
  config.gcPreset = presetId;
  config.aikarFlags = (presetId === 'aikar');
  saveCraftosConfig(serverId, config);

  commitServerChange(serverId, `Set JVM Garbage Collector preset to ${preset ? preset.name : 'Standard'}`, 'config');

  return {
    success: true,
    gcPreset: presetId,
    flags: preset ? preset.flags : []
  };
}
