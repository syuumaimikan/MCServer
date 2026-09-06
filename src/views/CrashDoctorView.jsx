import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  AlertTriangle,
  CheckCircle,
  Wrench,
  RefreshCw,
  FileText,
  HelpCircle,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { fetchCrashAnalysis, executeCrashRepairAction } from '../services/api';

export default function CrashDoctorView({ activeServer, onNotify, onTabChange }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const loadAnalysis = async () => {
    if (!activeServer) return;
    try {
      setLoading(true);
      const data = await fetchCrashAnalysis(activeServer.id);
      setAnalysis(data);
    } catch (err) {
      onNotify?.('error', '診断エラー', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [activeServer?.id]);

  const handleRepair = async (action, payload = {}) => {
    if (action === 'rollback_snapshot') {
      onTabChange?.('git');
      return;
    }

    try {
      setRepairing(true);
      const res = await executeCrashRepairAction(activeServer.id, action, payload);
      onNotify?.('success', '修復完了', res.message);
      await loadAnalysis();
    } catch (err) {
      onNotify?.('error', '修復失敗', err.message);
    } finally {
      setRepairing(false);
    }
  };

  const copyLogSnippet = () => {
    if (!analysis?.snippet) return;
    navigator.clipboard.writeText(analysis.snippet);
    setCopiedSnippet(true);
    onNotify?.('info', 'コピー完了', 'クラッシュログ抜粋をクリップボードにコピーしました');
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  if (!activeServer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <Stethoscope className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
        <p className="text-sm">サーバーを選択してください</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-rose-500/15 via-purple-500/10 to-indigo-500/10 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Stethoscope className="w-3.5 h-3.5" /> AI & Rule-based Crash Doctor
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              クラッシュ自動診断 & ワンクリック修復
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-xl">
              Go製超高速エンジンがクラッシュレポートやログを瞬時に走査し、原因（Mod競合、メモリ不足、Java非互換など）を特定して自動修復します。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAnalysis}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              再スキャン
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-white/50 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-400" />
          <p className="text-sm font-medium">ログとクラッシュレポートを高精度解析中...</p>
        </div>
      ) : !analysis?.hasCrash ? (
        /* Healthy State */
        <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">重大なクラッシュやエラーは検出されませんでした</h3>
            <p className="text-xs text-white/60 mt-1 max-w-md mx-auto">
              サーバーログおよびクラッシュレポートは正常です。快適にマルチプレイをお楽しみいただけます。
            </p>
          </div>
          <div className="text-[11px] text-emerald-300/80 font-mono">
            Analyzed by: {analysis?.engine || 'Go High-Speed Concurrent Engine'} ({analysis?.executionMs || 0.4}ms)
          </div>
        </div>
      ) : (
        /* Crash Detected State */
        <div className="space-y-6">
          {/* Issue Summary Card */}
          <div className="p-6 rounded-3xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white uppercase tracking-wider">
                    {analysis.issue.severity}
                  </span>
                  <h2 className="text-xl font-bold text-white">
                    {analysis.issue.title}
                  </h2>
                </div>
                <div className="text-xs text-white/50">
                  検出元: <span className="font-mono text-rose-300">{analysis.source}</span>
                  {analysis.timestamp && ` • ${new Date(analysis.timestamp).toLocaleString()}`}
                </div>
              </div>

              {analysis.issue.repairAction && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRepair(analysis.issue.repairAction, { fileName: analysis.culpritMod?.fileName })}
                  disabled={repairing}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 hover:from-rose-400 hover:to-amber-400 transition"
                >
                  {repairing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                  {analysis.issue.repairLabel || '自動修復を実行'}
                </motion.button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> 原因の解説
                </span>
                <p className="text-xs text-white/80 leading-relaxed">
                  {analysis.issue.explanation}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 推奨される解決策
                </span>
                <p className="text-xs text-white/80 leading-relaxed">
                  {analysis.issue.solution}
                </p>
              </div>
            </div>

            {/* Culprit Mod Highlight */}
            {analysis.culpritMod && (
              <div className="p-4 rounded-2xl bg-black/50 border border-rose-500/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-400">特定された原因Mod</span>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {analysis.culpritMod.fileName}
                  </div>
                </div>
                <button
                  onClick={() => handleRepair('disable_culprit_mod', { fileName: analysis.culpritMod.fileName })}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition"
                >
                  このModを無効化
                </button>
              </div>
            )}
          </div>

          {/* Raw Log & Stacktrace Preview */}
          <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-white/60" />
                <h3 className="text-sm font-bold text-white">スタックトレース抜粋</h3>
              </div>
              <button
                onClick={copyLogSnippet}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white text-xs font-medium transition"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                ログをコピー
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-black/60 border border-white/5 text-[11px] font-mono text-rose-200/90 overflow-x-auto max-h-72 custom-scrollbar whitespace-pre-wrap leading-relaxed">
              {analysis.snippet || 'ログなし'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
