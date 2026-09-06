# 🍎 CraftOS - Minecraft Java Server Studio

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)
![Minecraft](https://img.shields.io/badge/Minecraft-1.12.2%20--%201.21.4+-brightgreen.svg?style=flat-square&logo=minecraft)
![Fabric](https://img.shields.io/badge/Loader-Fabric%20%7C%20NeoForge%20%7C%20Paper%20%7C%20Purpur-orange.svg?style=flat-square)
![GUI](https://img.shields.io/badge/Design-Apple%20HIG%20%2F%20Frosted%20Glass-black.svg?style=flat-square&logo=apple)
![Git](https://img.shields.io/badge/Git-Auto--Commit%20Time%20Machine-red.svg?style=flat-square&logo=git)

**Appleの設計思想（Human Interface Guidelines）に基づいた、<br>超高速・軽量・簡単なマインクラフトJava版専用サーバー作成 ＆ 総合管理Studio**

[✨ 特徴](#-主な機能) • [🚀 クイックスタート](#-起動方法) • [⚡ 高速化エンジン](#-高速化エンジン--optimization-hub) • [⏳ Git Time Machine](#-git-time-machine-全自動コミット--履歴復元) • [📚 各種ドキュメント](#-充実したドキュメントマニュアル)

</div>

---

```
   ______           ______  ____  _____
  / ____/________ _/ __/ /_/ __ \/ ___/
 / /   / ___/ __ `/ /_/ __/ / / /\__ \ 
/ /___/ /  / /_/ / __/ /_/ /_/ /___/ / 
\____/_/   \__,_/_/  \__/\____//____/  
 Minecraft Java Edition Studio for Local PC
```

---

## ✨ 主な機能

### 1. 🚀 3ステップ高速サーバー作成ウィザード
- **Fabric** ⚡ (超軽量・最新Mod・Sodium/Lithium対応)
- **Paper / Purpur** 📜 🪶 (プラグイン対応・大人数接続時のTPS最適化)
- **NeoForge / Forge** 🛠️ ⚙️ (大規模Modパック・工業・魔術対応)
- **Vanilla** 🪵 (公式Mojangバニラ環境)
- 公式API・Fabric Meta・Paper Fill APIから最新バージョン一覧を自動取得し、1クリックでJARダウンロード、EULA自動同意、最適化JVM引数を適用。

### 2. ⚡ 高速化エンジン & Optimization Hub
- **厳選軽量化Modワンクリック一括導入**:
  - `Lithium` (物理演算・ホッパー・AI・チャンク処理を抜本的最適化)
  - `FerriteCore` (RAM消費量を40%〜50%削減)
  - `Krypton` (Nettyスタック・パケット遅延軽減)
  - `ModernFix` (起動時間2〜3倍高速化・メモリリーク修復)
  - `Spark` (リアルタイムラグプロファイラ)
  - `Chunky` (地形事前生成による飛行カクつき撲滅)
- **JVM ガベージコレクタ（GC）チューニング**:
  - Aikar's Flags (G1GC 最適化)
  - Shenandoah GC (超低遅延GC)
  - Generational ZGC (Java 21+ 大規模RAM向け)
- **Paper / Purpur サーバー設定チューニング**:
  - エンティティ索敵範囲、アイテム統合半径、非同期Tickの最適化。

### 3. ⏳ Git Time Machine (全自動コミット & 履歴復元)
- サーバー作成、Mod追加・削除・トグル、設定保存、バックアップ作成時に**全自動でGitコミットを記録**。
- Apple Time Machine風のタイムラインUIから、いつでも安全な過去のコミット時点へワンクリックでロールバック（巻き戻し）可能。

### 4. 🧩 Mod & プラグイン 1クリック統合管理 (Modrinth連携)
- **アプリ内Modストア**: Modrinth APIと連携し、数万種類のModやプラグインを検索してワンクリックで直接インストール。
- **Mod一覧管理**: 各Modの有効化/無効化スイッチ（`.disabled`切り替え）、削除、手動JARドラッグ＆ドロップアップロード。

### 5. 👥 リアルタイム プレイヤー管理
- 接続中プレイヤーのスキンアイコン表示（CraftHead API）。
- ワンクリックで キック / BAN / OP付与 / ゲームモード変更 / アイテム付与。
- ホワイトリスト・管理者・BANリストのビジュアル管理。

### 6. 🌐 ネットワーク & マルチプレイ参加アシスタント
- ローカルIP / パブリックIP自動取得。
- LINE / Discord 用の参加案内テキストのワンクリックコピー。
- ルーター設定不要の無料トンネリングツール（Playit.gg）完全解説。

### 7. 💻 Apple Terminal風 リアルタイムコンソール
- ANSIカラー対応の美しいログビューア。
- 検索フィルター（INFO / WARN / ERROR / COMMAND）。
### 8. 🩺 Crash Doctor (AI & ルールベース クラッシュ自動診断 & ワンクリック修復)
- Go製高速エンジンが `crash-reports/` や `logs/latest.log` を瞬時に解析。
- Mod競合、OOM（メモリ不足）、Java非互換、ポート重複、EULA未同意をピンポイント特定。
- 原因Modのワンクリック無効化、メモリ増量、EULA自動同意などの修復アクションを提供。

---

## 🏃 起動方法

### 方法 1: ワンクリック起動（Windows）
プロジェクトフォルダ内の `start.bat` をダブルクリックするだけで、Goネイティブエンジン、バックエンド、およびWeb GUIが自動起動します。

### 方法 2: コマンドラインから起動
```bash
# 依存パッケージのインストール（初回のみ）
npm install

# バックエンド & Web GUI の同時起動
npm start
```

ブラウザで `http://localhost:5173` を開くとGUIが表示されます。
（デスクトップアプリとしてウィンドウ表示したい場合は `npm run electron` で起動できます）

---

## 📚 充実したドキュメント・マニュアル

プロジェクトには、用途に応じた詳細な日本語ガイドが付属しています：

| ドキュメント | 概要 |
| :--- | :--- |
| [🚀 初心者スタートガイド](docs/START_GUIDE.md) | 3分でできるサーバー開設・参加手順書 |
| [⚡ 高速化・チューニングマニュアル](docs/OPTIMIZATION_GUIDE.md) | TPS 20を維持するMod・GC・Paper徹底解説 |
| [🩺 クラッシュ診断・解決マニュアル](docs/CRASH_TROUBLESHOOTING.md) | クラッシュ原因別の診断と解決手順 |
| [🧩 Mod & プラグイン導入ガイド](docs/MOD_GUIDE.md) | Modrinth連携・依存関係トラブル解決 |
| [🌐 ネットワーク & ポート開放マニュアル](docs/NETWORKING_GUIDE.md) | Playit.gg・ルーターポート開放・招待方法 |
| [⏳ Git Time Machine 解説書](docs/GIT_TIME_MACHINE.md) | 自動コミットと設定ロールバックの仕組み |

---

## 🛠️ 技術スタック

- **High-Speed Native Engine**: Go 1.26 (Goroutines, Concurrent Log Parser, Zero-latency Telemetry)
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide Icons, Framer Motion, Canvas Confetti
- **Backend**: Node.js, Express, WebSocket (`ws`), Git CLI Engine, Archiver, AdmZip, Systeminformation
- **Design Philosophy**: Apple macOS Sonoma / Sequoia & visionOS Frosted Glassmorphism, SF Pro Typography
- **Target Platform**: Windows 10/11, macOS, Linux (Local Host)

---

## 📄 ライセンス
MIT License. © Antigravity & CraftOS Project.
