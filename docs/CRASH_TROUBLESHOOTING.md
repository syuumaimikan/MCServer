# 🩺 CraftOS クラッシュトラブルシューティング & 診断ガイド

Minecraftサーバーが起動しない、またはプレイ中に突然停止（クラッシュ）してしまった場合の診断手順と解決方法を解説します。

CraftOSには、ログやスタックトレースを瞬時に解析して原因を特定する **「Crash Doctor（クラッシュ自動診断）」** が搭載されています。

---

## 📋 目次
1. [Crash Doctor による自動診断とワンクリック修復](#1-crash-doctor-による自動診断とワンクリック修復)
2. [よくあるクラッシュ原因 Top 6 と対策](#2-よくあるクラッシュ原因-top-6-と対策)
   - [① EULA（利用規約）未同意](#原因-1-eula利用規約未同意)
   - [② ポート重複衝突（Address already in use）](#原因-2-ポート重複衝突address-already-in-use)
   - [③ メモリ不足（OutOfMemoryError）](#原因-3-メモリ不足outofmemoryerror)
   - [④ Java バージョン非互換（UnsupportedClassVersionError）](#原因-4-java-バージョン非互換unsupportedclassversionerror)
   - [⑤ Modの競合・Mixin適用エラー](#原因-5-modの競合mixin適用エラー)
   - [⑥ 前提Mod（Dependency）の不足](#原因-6-前提moddependencyの不足)
3. [Time Machine を使った安全復元](#3-time-machine-を使った安全復元)

---

## 1. Crash Doctor による自動診断とワンクリック修復
サーバーがクラッシュした際は、CraftOSのサイドバーから **「🩺 クラッシュ診断 (Doctor)」** を開くだけで、Go言語製高速エンジンが自動で原因を特定し、修復ボタンを表示します。

- ⚡ **ワンクリック修復アクション例**:
  - `[EULAに自動同意して修復]`
  - `[ポートを+1に変更して重複解消]`
  - `[割り当てメモリを+2GB増量]`
  - `[特定された原因Modをワンクリック無効化]`

---

## 2. よくあるクラッシュ原因 Top 6 と対策

### 原因 1: EULA（利用規約）未同意
- **ログの目印**: `You need to agree to the EULA in order to run the server`
- **解説**: Mojangの利用規約への同意が完了していません。
- **解決法**: Crash Doctorの「EULAに自動同意して修復」を押すか、`eula.txt` の `eula=false` を `true` に書き換えます。

### 原因 2: ポート重複衝突（Address already in use）
- **ログの目印**: `FAILED TO BIND TO PORT` または `java.net.BindException: Address already in use`
- **解説**: 指定ポート（25565等）を別のMinecraftサーバーやアプリが占有しています。
- **解決法**: Crash Doctorの「ポートを+1に変更」を押すか、PCで重複して起動しているプロセスを終了します。

### 原因 3: メモリ不足（OutOfMemoryError）
- **ログの目印**: `java.lang.OutOfMemoryError: Java heap space`
- **解説**: 割り当てられたRAM（メモリ）の上限を超えてデータが蓄積されました。
- **解決法**: サーバー設定でRAMを 4GB〜8GB に増やし、「高速化」画面から `FerriteCore`（メモリ半減Mod）を導入してください。

### 原因 4: Java バージョン非互換（UnsupportedClassVersionError）
- **ログの目印**: `has been compiled by a more recent version of the Java Runtime (class file version 65.0)`
- **解説**: Minecraft 1.20.5以降は **Java 21**、1.18〜1.20.4は **Java 17** が必要です。
- **解決法**: システムに最新の Java 21（Temurin または Oracle JDK）をインストールしてください。

### 原因 5: Modの競合・Mixin適用エラー
- **ログの目印**: `org.spongepowered.asm.mixin.transformer.throwables.MixinTransformerError`
- **解説**: 導入したMod同士が同じゲーム処理を書き換えようとして衝突しました。
- **解決法**: Crash Doctorが特定した原因Modをワンクリックで無効化（`.disabled`）してください。

### 原因 6: 前提Mod（Dependency）の不足
- **ログの目印**: `Mod 'xyz' requires 'fabric-api' which is missing`
- **解説**: Modの動作に必要な基本ライブラリがありません。
- **解決法**: 「Mod」画面の Modrinth ストアから `Fabric API` や `Architectury API` を検索して追加導入してください。

---

## 3. Time Machine を使った安全復元
原因が特定できない複雑なクラッシュが発生した場合でも、CraftOSの **「⏳ Time Machine」** 画面から「クラッシュ前の正常稼働コミット」を選択して **「この時点に巻き戻す」** をクリックすれば、一瞬で安全な状態に復元できます。
