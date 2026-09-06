# ⚡ CraftOS サーバー高速化・TPS20維持チューニングマニュアル

Minecraftサーバーの処理速度を表す指標が **TPS（Ticks Per Second）** です。理想的な状態は **20.0 TPS**（1秒間に20回のゲーム処理が遅延なく行われる状態）です。

CraftOSに搭載された高速化エンジンとチューニング機能を活用することで、低スペックPCや大人数マルチプレイ環境でもTPS 20.0を維持できます。

---

## 📋 目次
1. [厳選軽量化Modの役割と導入効果](#1-厳選軽量化modの役割と導入効果)
2. [JVM ガベージコレクタ（GC）の最適化設定](#2-jvm-ガベージコレクタgcの最適化設定)
3. [Paper / Purpur サーバー設定の高速化](#3-paper--purpur-サーバー設定の高速化)
4. [Chunkyによるチャンク事前生成（飛行ラグ撲滅）](#4-chunkyによるチャンク事前生成飛行ラグ撲滅)
5. [Spark プロファイラによるラグ要因の特定](#5-spark-プロファイラによるラグ要因の特定)

---

## 1. 厳選軽量化Modの役割と導入効果
CraftOSの「⚡ 高速化 (Optimization)」画面から、ワンクリックで世界標準の最高峰最適化Modを一括導入できます。

### 🚀 主要最適化Mod一覧

| Mod名 | 最適化対象 | 解説 |
| :--- | :--- | :--- |
| **Lithium** | 物理演算・AI・ホッパー・チャンク計算 | バニラのゲーム挙動を100%保ったまま、サーバーCPU負荷を30%〜50%削減する絶対必須Mod。 |
| **FerriteCore** | メモリデータ構造 | Minecraft内部のデータアロケーションを効率化し、RAM消費量を約40%削減。 |
| **Krypton** | ネットワークパケット | Nettyスタックを改善し、プレイヤー移動時やチャンク送受信時のPing遅延を最小化。 |
| **ModernFix** | 起動処理・メモリリーク修復 | サーバーの起動時間を約半分に短縮し、長時間稼働によるメモリリークを自動修復。 |
| **Spark** | パフォーマンス診断 | `/spark profiler` コマンドで、どのMobやブロックが重いかをWebグラフで可視化。 |
| **Chunky** | ワールド生成 | プレイヤーが未開の地を探索する前に、事前にチャンクを生成しておくツール。 |

---

## 2. JVM ガベージコレクタ（GC）の最適化設定
Javaのガベージコレクション（不要メモリの破棄処理）が走る瞬間に、サーバーが一瞬フリーズする「GCラグ（スタッター）」が発生します。

CraftOSは「高速化」画面から最適なGCプリセットを選択できます：

### ① Aikar's G1GC Flags (標準推奨 🏆)
Minecraft界のレジェンドAikar氏によって設計された、世界で最も実績のあるG1GCフラグセットです。
```bash
-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:+PerfDisableSharedMem -XX:MaxTenuringThreshold=1 -Dusing.aikars.flags=https://mcflags.emc.gs -Daikars.new.flags=true
```

### ② Shenandoah Ultra-Low Latency GC
ガベージ回収をサーバー処理と完全に並行して行う超低遅延ガベージコレクタです。ポーズ時間を数ミリ秒以下に抑えます（Java 17/21対応）。

### ③ Generational ZGC (Java 21+)
テラバイト級の大規模メモリでも1ミリ秒未満の停止時間を実現するOracleの次世代GC。8GB以上のRAMを割り当てたサーバーに最適です。

---

## 3. Paper / Purpur サーバー設定の高速化
PaperまたはPurpurサーバーをご利用の場合、CraftOSの「Paper設定最適化」ボタンを押すことで、以下の設定が自動適用されます：

- **エンティティ索敵範囲（Activation Range）の最適化**:
  プレイヤーから遠いMobのAI処理頻度を下げ、無駄なCPU消費を削減。
- **ドロップアイテムの統合（Merge Radius）**:
  近くに落ちたアイテムや経験値オーブを自動でひとまとめにし、描画・処理エンティティ数を削減。
- **非同期チャンク読み込み / 保存**:
  メインスレッドをブロックすることなくチャンクを保存。

---

## 4. Chunkyによるチャンク事前生成（飛行ラグ撲滅）
エリトラで高速飛行した際やネザー探索時にサーバーがカクつく原因の99%は「新規チャンクの地形生成計算」です。

### 事前生成の手順：
1. 「高速化」画面または「Mod」画面から **Chunky** を導入。
2. サーバーコンソールで以下のコマンドを実行：
   ```text
   chunky radius 5000
   chunky start
   ```
3. 半径5,000ブロック（合計10,000×10,000ブロック）のワールドが事前に生成され、探索時の地形生成ラグが完全にゼロになります。

---

## 5. Spark プロファイラによるラグ要因の特定
サーバーが重くなった時は、コンソールに `/spark profiler --timeout 60` と入力してください。
60秒間の計測後、発行されたURLをクリックすると、どのMod・どのMob・どのRedstone回路が重い原因かを詳細なツリー構造で確認できます。
