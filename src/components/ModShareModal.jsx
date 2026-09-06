import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  FileArchive,
  Layers,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { fetchModpackShareInfo, getClientPackDownloadUrl } from '../services/api';

export default function ModShareModal({ isOpen, onClose, serverId, onToast }) {
  const [loading, setLoading] = useState(true);
  const [shareInfo, setShareInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && serverId) {
      setLoading(true);
      fetchModpackShareInfo(serverId)
        .then((data) => setShareInfo(data))
        .catch((err) => onToast?.({ title: '取得エラー', message: err.message, type: 'error' }))
        .finally(() => setLoading(false));
    }
  }, [isOpen, serverId]);

  if (!isOpen) return null;

  const handleCopyShareText = () => {
    if (!shareInfo?.shareText) return;
    navigator.clipboard.writeText(shareInfo.shareText);
    setCopied(true);
    onToast?.({
      title: 'コピー完了',
      message: '友達用 Modパック配布テキストをコピーしました',
      type: 'info'
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadUrl = getClientPackDownloadUrl(serverId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-neutral-900/95 border border-white/15 rounded-3xl shadow-2xl backdrop-blur-3xl overflow-hidden text-white flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">クライアント用 Mod パック配布センター</h3>
              <p className="text-[11px] text-white/50">サーバーに導入されたModを友達にワンクリック配布</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-white/50 text-xs">Modパック情報を準備中...</div>
          ) : (
            <>
              {/* Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Ready to distribute</span>
                  <h4 className="text-lg font-black text-white mt-0.5">
                    {shareInfo?.serverName} Client Modpack
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    <span className="capitalize">{shareInfo?.loader} {shareInfo?.version}</span>
                    <span>•</span>
                    <span className="font-semibold text-amber-300">{shareInfo?.modCount} 個のModを含む</span>
                  </div>
                </div>

                <a
                  href={downloadUrl}
                  download
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-orange-400 transition"
                >
                  <Download className="w-4 h-4" />
                  ZIP をダウンロード
                </a>
              </div>

              {/* Mod List Peek */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  パッケージに含まれる Mod ({shareInfo?.modCount} 個)
                </span>
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 max-h-36 overflow-y-auto custom-scrollbar flex flex-wrap gap-1.5">
                  {shareInfo?.mods?.map((modName, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs bg-white/5 text-white/80 border border-white/10 font-mono"
                    >
                      {modName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Share Message Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    LINE / Discord 用 友達への案内文
                  </span>
                  <button
                    onClick={handleCopyShareText}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'コピーしました！' : 'テキストをコピー'}
                  </button>
                </div>

                <pre className="p-4 rounded-2xl bg-black/50 border border-white/10 text-xs font-mono text-white/80 whitespace-pre-wrap leading-relaxed">
                  {shareInfo?.shareText}
                </pre>
              </div>

              {/* Client Install Guide Tip */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-white/70">
                <span className="font-bold text-white flex items-center gap-1">
                  💡 友達への導入案内アドバイス
                </span>
                <p>
                  友達はダウンロードした ZIP を解凍し、中にある <code className="text-amber-300 font-mono">mods</code> フォルダの中身をご自身の <code className="text-amber-300 font-mono">%appdata%\.minecraft\mods</code> に入れるだけで参加できます。
                </p>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
