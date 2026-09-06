import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Cpu,
  Sparkles,
  CheckCircle,
  Download,
  Flame,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Check,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  fetchOptimizationStatus,
  installPerformanceModsBatch,
  applyPaperPerformanceTweaks,
  setGCPreset
} from '../services/api';

export default function OptimizationView({ activeServer, onToast }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [selectedGCPreset, setSelectedGCPreset] = useState('aikar');
  const [applyingGC, setApplyingGC] = useState(false);
  const [applyingPaper, setApplyingPaper] = useState(false);

  const loadStatus = async () => {
    if (!activeServer) return;
    try {
      setLoading(true);
      const res = await fetchOptimizationStatus(activeServer.id);
      setData(res);
      setSelectedGCPreset(res.currentGCPreset || 'aikar');
    } catch (err) {
      onToast?.({ title: '読み込み失敗', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [activeServer?.id]);

  const handleInstallAllMods = async () => {
    try {
      setInstalling(true);
      const res = await installPerformanceModsBatch(activeServer.id);
      onToast?.({
        title: '高速化Mod導入完了',
        message: `${res.installedCount}個のパフォーマンスModを適用しました`,
        type: 'success'
      });
      await loadStatus();
    } catch (err) {
      onToast?.({ title: '導入エラー', message: err.message, type: 'error' });
    } finally {
      setInstalling(false);
    }
  };

  const handleApplyGCPreset = async (presetId) => {
    try {
      setApplyingGC(true);
      await setGCPreset(activeServer.id, presetId);
      setSelectedGCPreset(presetId);
      onToast?.({
        title: 'JVM設定更新',
        message: `ガベージコレクタを「${presetId}」に切り替えました`,
        type: 'success'
      });
      await loadStatus();
    } catch (err) {
      onToast?.({ title: '更新失敗', message: err.message, type: 'error' });
    } finally {
      setApplyingGC(false);
    }
  };

  const handleApplyPaperTweaks = async () => {
    try {
      setApplyingPaper(true);
      await applyPaperPerformanceTweaks(activeServer.id);
      onToast?.({
        title: 'Paper設定最適化',
        message: 'spigot.yml / paper 設定を最適化チューニングしました',
        type: 'success'
      });
      await loadStatus();
    } catch (err) {
      onToast?.({ title: '最適化失敗', message: err.message, type: 'error' });
    } finally {
      setApplyingPaper(false);
    }
  };

  if (!activeServer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <Zap className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
        <p className="text-sm">サーバーを選択してください</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/60">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-400 mb-3" />
        <p className="text-sm font-medium">パフォーマンス診断中...</p>
      </div>
    );
  }

  const score = data?.score || 50;
  const isFabric = activeServer.type === 'fabric';
  const isPaper = activeServer.type === 'paper' || activeServer.type === 'purpur';

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 max-w-6xl mx-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-amber-500/15 via-purple-500/10 to-blue-500/10 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Zap className="w-3.5 h-3.5" /> Performance Turbo Hub
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              サーバー高速化 & チューニング
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-xl">
              物理演算の軽量化、メモリ半減、GCスタッター（ラグ）抑制など、最高峰のMinecraftパフォーマンス環境をワンクリックで構築します。
            </p>
          </div>

          {/* Performance Score Circular Gauge */}
          <div className="flex items-center gap-4 bg-black/30 backdrop-blur-xl p-4 rounded-2xl border border-white/10">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="text-white/10"
                  strokeWidth="7"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className={score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}
                  strokeWidth="7"
                  strokeDasharray={213}
                  strokeDashoffset={213 - (213 * score) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-white">{score}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 -mt-1">Points</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-white/50">最適化スコア</div>
              <div className="text-sm font-semibold text-white">
                {score >= 80 ? '🚀 究極の超高速状態' : score >= 60 ? '⚡ 標準最適化済み' : '⚠️ 最適化の余地あり'}
              </div>
              <button
                onClick={loadStatus}
                className="mt-1 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition"
              >
                <RefreshCw className="w-3 h-3" /> 再診断する
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Performance Mods Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              厳選 軽量化・高速化 Mod 一括導入
            </h2>
            <p className="text-xs text-white/50 mt-0.5">
              世界中の大規模サーバーで愛用される必須最適化Modを自動検出し、ワンクリックでインストールします。
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInstallAllMods}
            disabled={installing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-orange-400 transition disabled:opacity-50"
          >
            {installing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                インストール中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                全推奨Modを一括導入
              </>
            )}
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.mods?.map((mod) => (
            <div
              key={mod.id}
              className={`relative rounded-2xl p-5 border transition-all duration-300 ${
                mod.installed
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{mod.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-medium">
                      {mod.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">by {mod.author}</div>
                </div>

                {mod.installed ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <CheckCircle className="w-3.5 h-3.5" /> 導入済み
                  </span>
                ) : (
                  <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                    未導入
                  </span>
                )}
              </div>

              <p className="text-xs text-white/70 mt-3 leading-relaxed min-h-[38px]">
                {mod.description}
              </p>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-amber-300/90 font-medium">{mod.impact}</span>
                {!mod.installed && (
                  <button
                    onClick={() => installPerformanceModsBatch(activeServer.id, [mod.id]).then(loadStatus)}
                    className="text-white hover:text-amber-300 flex items-center gap-1 font-medium transition"
                  >
                    個別に導入 <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paper / Spigot Tweaks Section (If Paper/Purpur) */}
      {isPaper && (
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                Paper / Spigot 高速化設定プリセット
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                エンティティの索敵範囲、アイテム統合半径、非同期Tick処理を最適化し、大人数同時接続時のTPSを向上させます。
              </p>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleApplyPaperTweaks}
              disabled={applyingPaper}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-xs transition flex items-center gap-2"
            >
              {applyingPaper ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              最適化設定を適用する
            </motion.button>
          </div>
        </div>
      )}

      {/* JVM Garbage Collector Tuning Section */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            高度な JVM ガベージコレクタ（GC）チューニング
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Javaのガベージコレクションによって発生する「瞬間的なカクつき（GCラグ）」を極限まで抑える専門フラグを選択できます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.gcPresets?.map((preset) => {
            const isSelected = selectedGCPreset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleApplyGCPreset(preset.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all duration-300 relative ${
                  isSelected
                    ? 'bg-purple-500/15 border-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-black/20 border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      {preset.name}
                    </h4>
                    <div className="text-[11px] text-purple-300 font-medium mt-0.5">
                      推奨メモリ: {preset.recommendedRam}
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition ${
                      isSelected ? 'border-purple-400 bg-purple-500 text-white' : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-white/60 mt-2 leading-relaxed">
                  {preset.description}
                </p>

                <div className="mt-3 text-[10px] text-white/40 font-mono bg-black/40 p-2 rounded-lg truncate">
                  {preset.flags.slice(0, 3).join(' ')} ...
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
