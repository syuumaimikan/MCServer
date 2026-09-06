# 🧩 CraftOS Mod & プラグイン 管理ガイド

CraftOSは、MinecraftのオープンソースModプラットフォーム **Modrinth** の公式APIと完全連携しています。ブラウザを開くことなく、アプリ内から数万種類のModやプラグインをワンクリックで直接検索・インストールできます。

---

## 📋 目次
1. [ローダーの選び方（Fabric vs NeoForge vs Paper）](#1-ローダーの選び方fabric-vs-neoforge-vs-paper)
2. [Modrinth ストアからModを導入する](#2-modrinth-ストアからmodを導入する)
3. [手動でJARファイルをドラッグ＆ドロップ追加する](#3-手動でjarファイルをドラッグドロップ追加する)
4. [Modの有効化 / 無効化切り替え](#4-modの有効化--無効化切り替え)
5. [よくあるModトラブルと依存関係の解決](#5-よくあるmodトラブルと依存関係の解決)

---

## 1. ローダーの選び方（Fabric vs NeoForge vs Paper）

| ローダー | 主な用途 | 特徴 |
| :--- | :--- | :--- |
| ⚡ **Fabric** | 軽量・最新バージョン・最適化 | アップデートが最速。SodiumやLithiumなどの最強軽量化Modが利用可能。 |
| 🛠️ **NeoForge / Forge** | 大規模Modパック・工業・魔術 | Create、Applied Energistics 2、Twilight Forestなどの大型Modパック向け。 |
| 📜 **Paper / Purpur** | プラグイン・経済・保護 | Spigot/Bukkitプラグイン（WorldEdit、CoreProtect、EssentialsX等）が動作。 |

---

## 2. Modrinth ストアからModを導入する
1. サイドバーの **「Mod & プラグイン」** を開きます。
2. 上部タブの **「Modrinth ストア」** を選択します。
3. 検索ボックスにMod名（例: `Fabric API`, `WorldEdit`, `Voice Chat`, `Lithium` など）を入力します。
4. 検索結果一覧から目的のModの **「インストール」** ボタンをクリックします。
5. CraftOSがサーバーのMinecraftバージョンとローダー（Fabric/NeoForge/Paper）に合致する最新JARを自動判定し、`mods/` または `plugins/` フォルダへ配置します。
6. インストール完了後、自動的にGitコミットが記録されます。

---

## 3. 手動でJARファイルをドラッグ＆ドロップ追加する
CurseForgeやGitHub等から手動でダウンロードした `.jar` ファイルがある場合：
1. 「Mod & プラグイン」画面の **「インストール済み」** タブを開きます。
2. 画面上部にある点線エリア **「ここにJARファイルをドラッグ＆ドロップ」** にファイルをドロップします。
3. アップロードが即座に完了し、自動でサーバーへ反映されます。

---

## 4. Modの有効化 / 無効化切り替え
Modを削除することなく一時的にテストしたい場合：
- 各Modカードの右側にある **スイッチ（トグル）** をクリックします。
- スイッチをOFFにするとファイル名が `.disabled` にリネームされ、サーバー起動時に読み込まれなくなります。
- 再度スイッチをONにすれば、一瞬で元に戻ります。

---

## 5. よくあるModトラブルと依存関係の解決

### Q. サーバー起動時に `Missing or incompatible mods` というエラーが出る
- **原因**: 導入したModが別の前提Mod（例: `Fabric API` や `Architectury API`）を要求しています。
- **対処法**: Modrinthストアで要求されているMod名を検索し、追加インストールしてください。特にFabricサーバーの場合は、まず最初に **「Fabric API」** を導入することを強く推奨します。

### Q. Modを入れたらサーバーがクラッシュした
- **対処法**: CraftOSの **「⏳ Time Machine」** 画面を開き、問題のModを導入する前の安全なコミットにワンクリックで巻き戻してください。
