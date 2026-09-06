# ⏳ CraftOS Git Time Machine (自動コミット＆復元システム)

CraftOSは、業界初となる **「Minecraftサーバー専用の完全自動 Git バージョン管理システム（Git Time Machine）」** を内蔵しています。

「新しいModを入れたらサーバーが起動しなくなった」「設定ファイルを書き換えたらエラーが出た」「建築前の状態に戻したい」といったトラブルを、AppleのTime Machineのように過去のコミット時点へワンクリックで巻き戻して解決できます。

---

## 📋 目次
1. [自動コミットが実行されるタイミング](#1-自動コミットが実行されるタイミング)
2. [Gitリポジトリの軽量化と除外ファイル設計](#2-gitリポジトリの軽量化と除外ファイル設計)
3. [Time Machine画面の使い方](#3-time-machine画面の使い方)
4. [ワンクリックロールバック（巻き戻し）の手順](#4-ワンクリックロールバック巻き戻しの手順)
5. [手動スナップショットの作成](#5-手動スナップショットの作成)

---

## 1. 自動コミットが実行されるタイミング
CraftOSはサーバー内で重要な変更が行われるたびに、自動的にGitリポジトリへ変更差分をコミットします：

| カテゴリ | トリガー条件 | 自動コミットメッセージ例 |
| :--- | :--- | :--- |
| 🛠️ **INIT** | サーバー新規作成時 | `[INIT] Initial server setup by CraftOS` |
| 🧩 **MOD** | Mod/プラグインの追加・削除・トグル時 | `[MOD] Installed mod: Lithium 0.12.7` / `[MOD] Disabled mod: create.jar` |
| ⚙️ **CONFIG** | server.properties / RAM等の変更時 | `[CONFIG] Updated server.properties configuration` |
| ⚡ **OPTIMIZER** | 高速化Mod一括導入 / GC設定変更時 | `[OPTIMIZER] Installed performance mods: Lithium, FerriteCore` |
| 🌍 **BACKUP** | ワールドバックアップ作成 / 復元時 | `[BACKUP] Created snapshot backup: backup-manual-xxx.zip` |
| 🛑 **SNAPSHOT** | ロールバック実行直前の安全退避 | `[SNAPSHOT] Pre-rollback auto-snapshot` |

---

## 2. Gitリポジトリの軽量化と除外ファイル設計
Minecraftサーバーのワールドデータや実行ログ（`logs/`）はGB単位になることがあります。CraftOSはリポジトリ作成時に最適化された `.gitignore` を自動生成し、重要な設定ファイル・Modファイル・主要ワールドメタデータのみを差分管理することで、超軽量かつ高速なコミット動作を実現しています。

```gitignore
# Large binary and runtime files
logs/
crash-reports/
cache/
.fabric/
libraries/
backups/
*.log.gz
*.log
session.lock
world/region/
world/entities/
```

---

## 3. Time Machine画面の使い方
1. CraftOSのサイドバーから **「⏳ Time Machine (Git)」** をクリックします。
2. 過去のすべての変更が、美しいAppleスタイルのタイムラインとして時系列順に表示されます。
3. 各コミットには以下の情報が表示されます：
   - 変更内容（Mod追加、設定変更など）
   - コミット日時（ISOタイムスタンプ）
   - コミットハッシュ（7桁の短いハッシュ値・ワンクリックコピー可能）
   - カテゴリバッジ

---

## 4. ワンクリックロールバック（巻き戻し）の手順
サーバーが動かなくなった場合：
1. 「Time Machine」画面を開きます。
2. 正常に動いていた過去のコミットを探します。
3. コミット右側の **「この時点に巻き戻す」** ボタンをクリックします。
4. 現在の状態が自動で一時スナップショットとして退避された後、選択した時点のファイル構成が完全に復元されます。

---

## 5. 手動スナップショットの作成
大型建築を始める前や、新しいModパックのテスト前などに、現在の状態を名前付きで保存できます：
1. 「Time Machine」画面上部の入力欄にメッセージ（例: `大型トラップタワー建築前`）を入力します。
2. **「スナップショット作成」** ボタンをクリックすると、即座にGitコミットが作成されます。
