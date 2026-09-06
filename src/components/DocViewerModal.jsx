import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Zap,
  Package,
  Globe,
  History,
  CheckCircle,
  HelpCircle,
  Terminal,
  ExternalLink,
  Search
} from 'lucide-react';

const DOCS = [
  {
    id: 'start',
    title: '🚀 クイックスタート',
    subtitle: '3ステップで始めるサーバー開設',
    icon: Zap,
    content: `
# 🚀 CraftOS クイックスタートガイド

CraftOSへようこそ！わずか3ステップで、誰でも自分専用のMinecraft Java版サーバーを高速に立ち上げられます。

---

## ステップ 1: サーバーを新規作成する
1. サイドバー左上の **「＋ 新規サーバー作成」** ボタンをクリックします。
2. サーバー名、タイプ（**Fabric**、**Paper**、**NeoForge**、**Vanilla**）を選択します。
   - ⚡ **Fabric**: 最新Mod（Sodium等）や軽量化Modを使いたい場合におすすめ
   - 📜 **Paper**: プラグイン導入や大人数での圧倒的軽さを重視する場合におすすめ
3. バージョンと割り当てメモリ（4GB〜8GB推奨）を選び、**「作成する」** をクリックします。

---

## ステップ 2: サーバーを起動する
1. ダッシュボード画面上の **「起動」** ボタンをクリックします。
2. リアルタイムコンソールでログが流れ、\`Done (...)! For help, type "help"\` と表示されれば起動完了です。

---

## ステップ 3: Minecraftから接続する
1. Minecraft Java版を起動し、**「マルチプレイ」** を選択します。
2. **「ダイレクト接続」** または **「サーバーを追加」** を選びます。
3. サーバーアドレスに \`localhost\`（同じPCの場合）または「ネットワーク」画面に表示されているIPアドレスを入力して参加します！
`
  },
  {
    id: 'optimization',
    title: '⚡ 高速化・TPS20チューニング',
    subtitle: '物理演算・メモリ・GC最適化',
    icon: Zap,
    content: `
# ⚡ サーバー高速化・TPS20維持マニュアル

Minecraftサーバーの処理速度（TPS: Ticks Per Second）は最大 **20.0** です。CraftOSは独自の最適化エンジンを搭載しています。

---

## 1. 厳選軽量化Modの一括導入 (Fabric / NeoForge)
「高速化 (Optimization)」画面からワンクリックで以下のModを導入できます：

| Mod名 | 効果 | 改善率 |
| :--- | :--- | :--- |
| **Lithium** | 物理演算、AI、チャンク計算の抜本的最適化 | TPS +30〜50% |
| **FerriteCore** | メモリデータ構造の再設計 | RAM消費量 -40% |
| **Krypton** | パケット通信・Nettyパイプラインの最適化 | Ping / パケット遅延軽減 |
| **ModernFix** | 起動時間の超短縮・各種メモリリーク修復 | 起動時間 2〜3倍高速化 |
| **Spark** | リアルタイムラグプロファイラ（\`/spark profiler\`） | ラグ要因特定 |

---

## 2. JVM ガベージコレクタ（GC）の最適化
Javaのメモリ自動解放（GC）による瞬間的なカクつきを防ぐため、CraftOSは以下のプリセットを提供しています：

- 🏆 **Aikar's G1GC Flags (標準推奨)**: 世界中の大手サーバーで実績のある最高峰のG1GC設定。
- ⚡ **Shenandoah GC**: アプリケーションと並行してガベージを回収し、停止時間を1ミリ秒以下に抑える超低遅延GC。
- 🔮 **Generational ZGC (Java 21+)**: 大容量RAM（8GB以上）サーバーに最適な次世代GC。
`
  },
  {
    id: 'mods',
    title: '🧩 Mod・プラグイン管理',
    subtitle: 'Modrinth連携・ドラッグ＆ドロップ',
    icon: Package,
    content: `
# 🧩 Mod & プラグイン 管理ガイド

CraftOSは Modrinth 公式APIと完全連携しており、数万種類のModやプラグインをブラウザを使わずに直接インストールできます。

---

## Modの探し方・入れ方
1. サイドバーの **「Mod / プラグイン」** を開きます。
2. **「Modrinth ストア」** タブをクリックします。
3. 検索バーにMod名（例: \`Sodium\`, \`Lithium\`, \`WorldEdit\` 等）を入力し、検索します。
4. **「インストール」** ボタンをクリックするだけで、サーバーの \`mods/\` または \`plugins/\` フォルダに即時導入されます。

---

## 手動でのJARファイル追加
手持ちの \`.jar\` ファイルがある場合は、「インストール済み」タブの点線枠に直接ドラッグ＆ドロップするだけでアップロード完了です。

---

## Modの有効化 / 無効化
スイッチを1クリックするだけで、ファイルを削除することなく一時的に無効化（\`.disabled\`）できます。
`
  },
  {
    id: 'network',
    title: '🌐 マルチプレイ・ポート開放',
    subtitle: '友達を招待・Playit.gg連携',
    icon: Globe,
    content: `
# 🌐 マルチプレイ参加 & ネットワーク公開ガイド

CraftOSで立てたサーバーに、友達を招待して一緒に冒険する方法を解説します。

---

## 方法 A: Playit.gg を使う (一番簡単・ルーター設定不要)
ルーターのパスワードが分からない場合や、安全に外部公開したい場合に最適です。

1. [Playit.gg](https://playit.gg) から無料ソフトをダウンロードして実行します。
2. 表示されたURLを開き、**「Add Tunnel」→「Minecraft Java」** を選択します。
3. 発行された \`xxxx.playit.gg\` アドレスを友達に教えるだけで接続できます！

---

## 方法 B: ルーターのポート開放 (最高速・低遅延)
1. 「ネットワーク」画面であなたのPCの **ローカルIP**（例: \`192.168.1.5\`）を確認します。
2. ブラウザでご家庭のWi-Fiルーター管理画面を開きます。
3. ポート転送（ポートマッピング）で **ポート 25565 (TCP)** を上記ローカルIPへ転送設定します。
4. 「ネットワーク」画面の **パブリックアドレス**（例: \`123.45.67.89:25565\`）を友達に共有します。
`
  },
  {
    id: 'git',
    title: '⏳ Git Time Machine & 復元',
    subtitle: '全自動コミットと巻き戻し',
    icon: History,
    content: `
# ⏳ Git Time Machine (自動バックアップ＆復元)

CraftOSは、サーバーの安全性を極限まで高めるため、すべての変更をローカルGitリポジトリに自動記録しています。

---

## 自動コミットが実行されるタイミング
- 🛠️ サーバー新規作成時
- 🧩 Mod/プラグインのインストール・削除・有効化/無効化時
- ⚙️ server.properties やメモリ等の設定変更時
- 🌍 ワールドバックアップ作成時
- 🛑 サーバー停止時

---

## 過去の時点へのロールバック（巻き戻し）
もしModの競合でサーバーが起動しなくなったり、設定を間違えて壊してしまった場合：
1. **「Time Machine」** 画面を開きます。
2. タイムラインから正常に動いていた過去のコミットを探します。
3. **「この時点に巻き戻す」** ボタンをクリックするだけで、一瞬でその時の安全な状態に復元されます。
`
  }
];

export default function DocViewerModal({ isOpen, onClose }) {
  const [activeDocId, setActiveDocId] = useState('start');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const currentDoc = DOCS.find((d) => d.id === activeDocId) || DOCS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-5xl h-[85vh] bg-neutral-900/90 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden text-white"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              CraftOS 総合ドキュメント & ガイド
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Doc Navigation Sidebar */}
          <div className="w-full md:w-72 border-r border-white/10 bg-black/20 p-4 space-y-2 overflow-y-auto">
            {DOCS.map((doc) => {
              const Icon = doc.icon;
              const isActive = doc.id === activeDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocId(doc.id)}
                  className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition-all ${
                    isActive
                      ? 'bg-amber-500/20 border border-amber-400/30 text-white shadow-md'
                      : 'hover:bg-white/5 text-white/70 hover:text-white border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 ${isActive ? 'text-amber-400' : 'text-white/40'}`} />
                  <div>
                    <div className="text-xs font-bold">{doc.title}</div>
                    <div className="text-[11px] text-white/40">{doc.subtitle}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Doc Content Area */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-black/10">
            <div className="prose prose-invert prose-amber max-w-none space-y-4 text-sm leading-relaxed text-white/80">
              <div
                dangerouslySetInnerHTML={{
                  __html: currentDoc.content
                    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white pb-3 border-b border-white/10 mb-4">$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-amber-300 mt-6 mb-2 flex items-center gap-2">$1</h2>')
                    .replace(/^---/gim, '<hr class="border-white/10 my-4" />')
                    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-white font-bold">$1</strong>')
                    .replace(/\`(.*?)\`/gim, '<code class="bg-white/10 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
                    .replace(/\n\n/gim, '<br />')
                }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
