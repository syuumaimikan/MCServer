import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit,
  Clock,
  RotateCcw,
  Plus,
  RefreshCw,
  Tag,
  CheckCircle,
  Copy,
  AlertCircle,
  History,
  ShieldAlert,
  ArrowDown
} from 'lucide-react';
import {
  fetchGitHistory,
  createManualGitCommit,
  rollbackGitCommit
} from '../services/api';

export default function GitHistoryView({ activeServer, onToast }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualMessage, setManualMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const loadHistory = async () => {
    if (!activeServer) return;
    try {
      setLoading(true);
      const data = await fetchGitHistory(activeServer.id);
      setCommits(data);
    } catch (err) {
      onToast?.({ title: 'Git履歴取得失敗', message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [activeServer?.id]);

  const handleCreateManualCommit = async (e) => {
    e.preventDefault();
    if (!manualMessage.trim()) return;

    try {
      setIsCommitting(true);
      await createManualGitCommit(activeServer.id, manualMessage.trim(), 'manual');
      setManualMessage('');
      onToast?.({
        title: 'スナップショット作成完了',
        message: '現在のサーバー状態をGitにコミット保存しました',
        type: 'success'
      });
      await loadHistory();
    } catch (err) {
      onToast?.({ title: 'コミット失敗', message: err.message, type: 'error' });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleRollback = async (hash) => {
    if (!confirm(`コミット [${hash}] の状態にサーバー設定を巻き戻しますか？現在の状態は事前に自動バックアップされます。`)) {
      return;
    }

    try {
      setIsRollingBack(true);
      await rollbackGitCommit(activeServer.id, hash);
      onToast?.({
        title: 'ロールバック完了',
        message: `コミット [${hash}] の状態へ復元しました`,
        type: 'success'
      });
      setSelectedCommit(null);
      await loadHistory();
    } catch (err) {
      onToast?.({ title: '復元失敗', message: err.message, type: 'error' });
    } finally {
      setIsRollingBack(false);
    }
  };

  const getCategoryBadge = (category) => {
    switch (category?.toLowerCase()) {
      case 'mod':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">MOD 変更</span>;
      case 'config':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">設定 更新</span>;
      case 'backup':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">バックアップ</span>;
      case 'world':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">ワールド</span>;
      case 'optimizer':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/20 text-orange-300 border border-orange-500/30">高速化 最適化</span>;
      case 'rollback':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">ロールバック</span>;
      case 'init':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">初期作成</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/70 border border-white/10">手動記録</span>;
    }
  };

  if (!activeServer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <History className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">サーバーを選択してください</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto custom-scrollbar">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-pink-500/10 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <History className="w-3.5 h-3.5" /> Time Machine & Version Vault
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Git 自動コミット & 履歴復元
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-xl">
              Modの導入や設定変更、バックアップ時にすべての状態が自動でローカルGitリポジトリに保存されます。いつでも過去の安全な状態に巻き戻せます。
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            履歴を更新
          </button>
        </div>
      </div>

      {/* Create Manual Snapshot Card */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-400" />
          現在の状態を手動スナップショット保存
        </h3>
        <form onSubmit={handleCreateManualCommit} className="flex gap-3">
          <input
            type="text"
            value={manualMessage}
            onChange={(e) => setManualMessage(e.target.value)}
            placeholder="例: 大型建築前のバックアップ、テストMod導入前の安定版 など"
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-400/20 transition"
          />
          <button
            type="submit"
            disabled={isCommitting || !manualMessage.trim()}
            className="px-5 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition flex items-center gap-2 disabled:opacity-40"
          >
            {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
            スナップショット作成
          </button>
        </form>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          コミット履歴タイムライン ({commits.length} 件)
        </h3>

        {loading ? (
          <div className="p-12 text-center text-white/50 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-indigo-400" />
            <p className="text-xs">タイムラインを読み込み中...</p>
          </div>
        ) : commits.length === 0 ? (
          <div className="p-12 text-center text-white/40 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-sm">コミット履歴がまだありません</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-white/10 space-y-6">
            {commits.map((commit, index) => {
              const isFirst = index === 0;
              return (
                <div key={commit.hash} className="relative group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 transition-all ${
                      isFirst
                        ? 'bg-indigo-500 border-indigo-300 ring-4 ring-indigo-500/20'
                        : 'bg-black/80 border-white/30 group-hover:border-indigo-400'
                    }`}
                  />

                  {/* Commit Box */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 backdrop-blur-xl transition duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          {getCategoryBadge(commit.category)}
                          <span className="font-semibold text-white text-sm">
                            {commit.subject}
                          </span>
                          {isFirst && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 font-bold">
                              HEAD (最新)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-white/40">
                          <span className="font-mono text-indigo-300/80 bg-black/40 px-1.5 py-0.5 rounded">
                            {commit.hash}
                          </span>
                          <span>{commit.date}</span>
                          <span>by {commit.author}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(commit.hash);
                            onToast?.({ title: 'コピー完了', message: `コミットハッシュ [${commit.hash}] をコピーしました`, type: 'info' });
                          }}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                          title="ハッシュをコピー"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {!isFirst && (
                          <button
                            onClick={() => handleRollback(commit.hash)}
                            disabled={isRollingBack}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            この時点に巻き戻す
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
