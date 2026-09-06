import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Wifi,
  Copy,
  Check,
  Share2,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Laptop,
  CheckCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { fetchSystemInfo, fetchPublicIP } from '../services/api';

export default function NetworkView({ activeServer, onToast }) {
  const [systemInfo, setSystemInfo] = useState(null);
  const [publicIP, setPublicIP] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [sys, pub] = await Promise.all([
          fetchSystemInfo(),
          fetchPublicIP().catch(() => ({ ip: '取得失敗' }))
        ]);
        setSystemInfo(sys);
        setPublicIP(pub.ip || '取得失敗');
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const copyToClipboard = (text, key, label) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast?.({
      title: 'コピー完了',
      message: `${label} をクリップボードにコピーしました`,
      type: 'info'
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const port = activeServer?.port || 25565;
  const localAddress = `${systemInfo?.localIp || '127.0.0.1'}:${port}`;
  const publicAddress = `${publicIP}:${port}`;

  const getInviteText = () => {
    return [
      `🎮 【Minecraftサーバー 参加案内】`,
      `サーバー名: ${activeServer?.name || 'Minecraft Server'}`,
      `バージョン: ${activeServer?.version || '最新版'} (${activeServer?.type || 'Fabric'})`,
      `接続アドレス: ${publicAddress}`,
      `※ 同じWi-Fi（LAN内）から参加する場合は: ${localAddress}`,
      `みんなで一緒に遊ぼう！`
    ].join('\n');
  };

  if (!activeServer) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/40">
        <Globe className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">サーバーを選択してください</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto custom-scrollbar">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-blue-500/10 border border-white/10 backdrop-blur-2xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Globe className="w-3.5 h-3.5" /> Network & Multiplayer Hub
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              ネットワーク & マルチプレイ接続
            </h1>
            <p className="text-sm text-white/60 mt-1 max-w-xl">
              あなたのPCで稼働中のサーバーへ接続するためのIPアドレスや、友達を招待するための案内文を取得できます。
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => copyToClipboard(getInviteText(), 'invite', 'Discord/LINE用 招待文')}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition"
          >
            {copiedKey === 'invite' ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            友達用の招待テキストをコピー
          </motion.button>
        </div>
      </div>

      {/* Direct Connection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Network Card */}
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Laptop className="w-5 h-5 text-blue-400" />
              ローカル接続 (自分 / 同じWi-Fi)
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              LAN / 自宅内
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            サーバーを動かしているあなた自身、または同じ家庭内Wi-Fiにつながっている家族や友達が接続するアドレスです。
          </p>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3 px-4">
            <span className="font-mono text-white text-sm font-semibold tracking-wide">
              {localAddress}
            </span>
            <button
              onClick={() => copyToClipboard(localAddress, 'local', 'ローカルアドレス')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition"
            >
              {copiedKey === 'local' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Global Public Card */}
        <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <Globe className="w-5 h-5 text-emerald-400" />
              インターネット接続 (外部の友達)
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              WAN / インターネット
            </span>
          </div>
          <p className="text-xs text-white/60 leading-relaxed">
            別の家に住む友達がインターネット経由で接続するアドレスです（ポート開放またはトンネリングが必要です）。
          </p>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-2xl p-3 px-4">
            <span className="font-mono text-white text-sm font-semibold tracking-wide truncate mr-2">
              {publicAddress}
            </span>
            <button
              onClick={() => copyToClipboard(publicAddress, 'public', 'パブリックアドレス')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition shrink-0"
            >
              {copiedKey === 'public' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Port Forwarding / Tunneling Guide */}
      <div className="p-7 rounded-3xl bg-white/5 border border-white/10 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            外部の友達と遊ぶための 2 つの方法
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            自宅のルーター設定に自信がない場合でも、無料ツールを使えば誰でも1分でサーバーを公開できます。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Method 1: Playit.gg (Recommended) */}
          <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                🌟 Playit.gg (超おすすめ・ルーター設定不要)
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                完全無料
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              自宅のルーターのポート開放をすることなく、安全な固定アドレスを発行してくれる最も簡単なトンネリングサービスです。
            </p>
            <ol className="text-xs text-white/70 space-y-1.5 list-decimal list-inside bg-black/20 p-3 rounded-xl">
              <li>公式サイトから小さなアプリをダウンロードして起動</li>
              <li>「Add Tunnel」からMinecraft (Java) を選択</li>
              <li>発行された `xxx.playit.gg` アドレスを友達に教えるだけ！</li>
            </ol>
            <a
              href="https://playit.gg"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition mt-2"
            >
              Playit.gg 公式サイトを開く <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Method 2: Standard Router Port Forwarding */}
          <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                ⚙️ ルーターのポート開放 (直接通信)
              </span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                最高速・低遅延
              </span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">
              自宅のWi-Fiルーターの設定画面でポート <code className="text-amber-300 font-mono">25565 (TCP)</code> をあなたのPC（{systemInfo?.localIp || '192.168.x.x'}）へ転送設定します。
            </p>
            <ol className="text-xs text-white/70 space-y-1.5 list-decimal list-inside bg-black/20 p-3 rounded-xl">
              <li>ブラウザでルーター設定画面（192.168.1.1等）にログイン</li>
              <li>「ポートマッピング / ポート転送」を開く</li>
              <li>宛先IPにPCのローカルIP、ポートに <span className="font-mono text-amber-300">{port}</span> (TCP) を登録</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
