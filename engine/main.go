package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"sort"
	"strings"
	"time"
)

type CrashAnalysisResult struct {
	HasCrash     bool         `json:"hasCrash"`
	Source       string       `json:"source"`
	Timestamp    string       `json:"timestamp"`
	Issue        *CrashIssue  `json:"issue,omitempty"`
	CulpritMod   *CulpritMod  `json:"culpritMod,omitempty"`
	ErrorSummary []string     `json:"errorSummary"`
	Snippet      string       `json:"snippet"`
	Engine       string       `json:"engine"`
	ExecutionMs  float64      `json:"executionMs"`
}

type CrashIssue struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Severity    string `json:"severity"`
	Category    string `json:"category"`
	Explanation string `json:"explanation"`
	Solution    string `json:"solution"`
	RepairAction string `json:"repairAction"`
	RepairLabel string `json:"repairLabel"`
}

type CulpritMod struct {
	FileName   string `json:"fileName"`
	Name       string `json:"name"`
	Confidence string `json:"confidence"`
}

type EngineStatus struct {
	Engine        string  `json:"engine"`
	Version       string  `json:"version"`
	GoVersion     string  `json:"goVersion"`
	NumCPU        int     `json:"numCpu"`
	NumGoroutines int     `json:"numGoroutines"`
	MemoryAllocMB float64 `json:"memoryAllocMB"`
	UptimeSec     int64   `json:"uptimeSec"`
	Status        string  `json:"status"`
}

var (
	startTime = time.Now()

	ruleEula = regexp.MustCompile(`(?i)You need to agree to the EULA in order to run the server|Failed to load eula\.txt`)
	rulePort = regexp.MustCompile(`(?i)FAILED TO BIND TO PORT|Address already in use: bind|java\.net\.BindException`)
	ruleOOM  = regexp.MustCompile(`(?i)java\.lang\.OutOfMemoryError|There is insufficient memory for the Java Runtime Environment`)
	ruleJava = regexp.MustCompile(`(?i)has been compiled by a more recent version of the Java Runtime|UnsupportedClassVersionError`)
	ruleMixin = regexp.MustCompile(`(?i)org\.spongepowered\.asm\.mixin\.transformer\.throwables\.MixinTransformerError|Mixin apply failed for`)
	ruleDependency = regexp.MustCompile(`(?i)Mod '([^']+)' \(([^\)]+)\) requires .* which is missing`)
)

func main() {
	mux := http.NewServeMux()

	// CORS Middleware wrapper
	corsHandler := func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}
			next(w, r)
		}
	}

	// Health & Engine Status
	mux.HandleFunc("/api/engine/status", corsHandler(handleEngineStatus))

	// High-speed Crash Analysis in Go
	mux.HandleFunc("/api/engine/crash-analyze", corsHandler(handleCrashAnalyze))

	port := 3002
	fmt.Printf("🚀 [CraftOS Native Go Engine] Running on http://localhost:%d (Go %s, %d CPUs)\n", port, runtime.Version(), runtime.NumCPU())
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", port), mux))
}

func handleEngineStatus(w http.ResponseWriter, r *http.Request) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	status := EngineStatus{
		Engine:        "CraftOS Native High-Speed Go Engine",
		Version:       "2.0.0-Turbo",
		GoVersion:     runtime.Version(),
		NumCPU:        runtime.NumCPU(),
		NumGoroutines: runtime.NumGoroutine(),
		MemoryAllocMB: float64(m.Alloc) / (1024 * 1024),
		UptimeSec:     int64(time.Since(startTime).Seconds()),
		Status:        "OPTIMAL",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func handleCrashAnalyze(w http.ResponseWriter, r *http.Request) {
	t0 := time.Now()
	serverId := r.URL.Query().Get("serverId")
	if serverId == "" {
		http.Error(w, `{"error":"serverId parameter is required"}`, http.StatusBadRequest)
		return
	}

	// Path to server directory
	serverDir := filepath.Join("..", "servers", serverId)
	if _, err := os.Stat(serverDir); os.IsNotExist(err) {
		serverDir = filepath.Join("servers", serverId)
	}

	if _, err := os.Stat(serverDir); os.IsNotExist(err) {
		http.Error(w, `{"error":"Server directory not found"}`, http.StatusNotFound)
		return
	}

	result := analyzeCrashFast(serverDir)
	result.ExecutionMs = float64(time.Since(t0).Microseconds()) / 1000.0
	result.Engine = "Go High-Speed Concurrent Engine"

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func analyzeCrashFast(serverDir string) CrashAnalysisResult {
	crashReportsDir := filepath.Join(serverDir, "crash-reports")
	latestLogPath := filepath.Join(serverDir, "logs", "latest.log")

	var rawLog string
	var source string
	var timestamp string

	// 1. Check crash-reports
	if entries, err := os.ReadDir(crashReportsDir); err == nil {
		type fileInfo struct {
			name  string
			mtime time.Time
		}
		var reports []fileInfo
		for _, e := range entries {
			if strings.HasPrefix(e.Name(), "crash-") && strings.HasSuffix(e.Name(), ".txt") {
				if info, err := e.Info(); err == nil {
					reports = append(reports, fileInfo{name: e.Name(), mtime: info.ModTime()})
				}
			}
		}
		sort.Slice(reports, func(i, j int) bool {
			return reports[i].mtime.After(reports[j].mtime)
		})

		if len(reports) > 0 {
			target := filepath.Join(crashReportsDir, reports[0].name)
			if data, err := os.ReadFile(target); err == nil {
				rawLog = string(data)
				source = "crash-reports/" + reports[0].name
				timestamp = reports[0].mtime.Format(time.RFC3339)
			}
		}
	}

	// 2. Fallback to latest.log
	if rawLog == "" {
		if data, err := os.ReadFile(latestLogPath); err == nil {
			rawLog = string(data)
			source = "logs/latest.log"
			if info, err := os.Stat(latestLogPath); err == nil {
				timestamp = info.ModTime().Format(time.RFC3339)
			}
		}
	}

	if rawLog == "" {
		return CrashAnalysisResult{
			HasCrash: false,
			Source:   "none",
			Snippet:  "No crash reports or logs found.",
		}
	}

	lines := strings.Split(rawLog, "\n")
	var errorLines []string
	for _, l := range lines {
		if strings.Contains(l, "ERROR") || strings.Contains(l, "Exception") || strings.Contains(l, "FATAL") {
			errorLines = append(errorLines, strings.TrimSpace(l))
		}
	}

	// Match pattern
	var issue *CrashIssue

	if ruleEula.MatchString(rawLog) {
		issue = &CrashIssue{
			ID:          "eula_not_agreed",
			Title:       "📜 EULA（利用規約）未同意",
			Severity:    "high",
			Category:    "configuration",
			Explanation: "Minecraftサーバーの利用規約（EULA）に同意していません。サーバー起動が即座に中断されました。",
			Solution:    "eula.txt 内の eula=false を eula=true に変更してください。",
			RepairAction: "fix_eula",
			RepairLabel: "EULAに自動同意して修復",
		}
	} else if rulePort.MatchString(rawLog) {
		issue = &CrashIssue{
			ID:          "port_already_in_use",
			Title:       "🔌 ポート重複衝突（Address already in use）",
			Severity:    "critical",
			Category:    "network",
			Explanation: "指定されたポート（例: 25565）が既に別のMinecraftサーバーやアプリケーションで使用されているため起動できません。",
			Solution:    "別のCraftOSサーバーが起動中ではないか確認するか、サーバーのポート番号を変更してください。",
			RepairAction: "change_port",
			RepairLabel: "ポートを +1（空きポート）に変更",
		}
	} else if ruleOOM.MatchString(rawLog) {
		issue = &CrashIssue{
			ID:          "out_of_memory",
			Title:       "⚠️ メモリ不足（Out of Memory）",
			Severity:    "critical",
			Category:    "memory",
			Explanation: "Minecraftサーバーに割り当てられたRAM（メモリ）が枯渇しました。",
			Solution:    "サーバー設定から割り当てメモリ（RAM）を 2GB〜4GB 増量してください。",
			RepairAction: "increase_ram",
			RepairLabel: "割り当てメモリを +2GB 増量",
		}
	} else if ruleJava.MatchString(rawLog) {
		issue = &CrashIssue{
			ID:          "java_version_mismatch",
			Title:       "☕ Java バージョン非互換（Java Mismatch）",
			Severity:    "critical",
			Category:    "java",
			Explanation: "MinecraftやModが要求するJavaバージョンと、PCのJavaバージョンが一致していません。",
			Solution:    "Minecraft 1.20.5以降は Java 21 が必須です。",
			RepairAction: "guide_java",
			RepairLabel: "Java 21 の導入案内を確認",
		}
	} else if ruleMixin.MatchString(rawLog) {
		issue = &CrashIssue{
			ID:          "mixin_apply_failed",
			Title:       "💥 Mod Mixin 適用エラー（Mod競合）",
			Severity:    "critical",
			Category:    "mod_conflict",
			Explanation: "特定のModがゲーム内部コードの書き換えに失敗しました。Modの競合またはバージョン非互換が原因です。",
			Solution:    "対象Modを特定し、一時的に無効化または更新してください。",
			RepairAction: "disable_culprit_mod",
			RepairLabel: "原因Modをワンクリック無効化",
		}
	} else if len(errorLines) > 0 {
		issue = &CrashIssue{
			ID:          "general_exception",
			Title:       "⚠️ サーバー例外エラー / クラッシュ",
			Severity:    "high",
			Category:    "general",
			Explanation: "スタックトレースまたはログに重大なエラー例外が記録されました。",
			Solution:    "該当Modの削除またはTime Machineからの復元をお試しください。",
			RepairAction: "rollback_snapshot",
			RepairLabel: "Time Machineで直前の安定版に戻す",
		}
	}

	// Culprit mod detection
	var culprit *CulpritMod
	modsDir := filepath.Join(serverDir, "mods")
	if entries, err := os.ReadDir(modsDir); err == nil {
		for _, e := range entries {
			if strings.HasSuffix(e.Name(), ".jar") {
				raw := strings.TrimSuffix(e.Name(), ".jar")
				parts := strings.Split(raw, "-")
				mainId := strings.ToLower(parts[0])
				if len(mainId) > 2 && strings.Contains(strings.ToLower(rawLog), mainId) {
					culprit = &CulpritMod{
						FileName:   e.Name(),
						Name:       raw,
						Confidence: "high",
					}
					break
				}
			}
		}
	}

	snippetStart := len(lines) - 40
	if snippetStart < 0 {
		snippetStart = 0
	}
	snippet := strings.Join(lines[snippetStart:], "\n")

	var summary []string
	if len(errorLines) > 5 {
		summary = errorLines[:5]
	} else {
		summary = errorLines
	}

	return CrashAnalysisResult{
		HasCrash:     issue != nil,
		Source:       source,
		Timestamp:    timestamp,
		Issue:        issue,
		CulpritMod:   culprit,
		ErrorSummary: summary,
		Snippet:      snippet,
	}
}
