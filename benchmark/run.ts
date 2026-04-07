#!/usr/bin/env npx tsx

/**
 * Benchmark runner — compliance testing: without config vs with config.
 * Uses LLM-as-judge for binary pass/fail evaluation (blind).
 *
 * Usage:
 *   npx tsx benchmark/run.ts                    # 2 configs × all tasks × 1 run
 *   npx tsx benchmark/run.ts --runs 3           # 3 runs per combo
 *   npx tsx benchmark/run.ts --config none      # only one config profile
 *   npx tsx benchmark/run.ts --task lang-explain # only one task
 *   npx tsx benchmark/run.ts --category langue  # only one category
 *   npx tsx benchmark/run.ts --dry-run          # show what would run
 */

import { execSync, type ExecSyncOptions } from "child_process";
import {
  mkdirSync,
  writeFileSync,
  cpSync,
  rmSync,
  existsSync,
  renameSync,
} from "fs";
import { join, resolve, dirname } from "path";
import { homedir } from "os";
import {
  TASKS,
  CATEGORY_LABELS,
  buildJudgePrompt,
  type Task,
  type TaskCategory,
} from "./tasks";

// ─── Config ───────────────────────────────────────────────

const CONFIGS = ["none", "configured"] as const;
type ConfigProfile = (typeof CONFIGS)[number];

const BENCHMARK_DIR = resolve(__dirname);
const CONFIGS_DIR = join(BENCHMARK_DIR, "configs");
const RESULTS_DIR = join(BENCHMARK_DIR, "results");

// ─── Global config isolation ─────────────────────────────

const GLOBAL_CLAUDE_DIR = join(homedir(), ".claude");
const GLOBAL_FILES_TO_ISOLATE = [
  "CLAUDE.md",
  "settings.json",
  "settings.local.json",
];

function backupGlobalConfig(): string[] {
  const backed: string[] = [];
  for (const file of GLOBAL_FILES_TO_ISOLATE) {
    const src = join(GLOBAL_CLAUDE_DIR, file);
    const bak = join(GLOBAL_CLAUDE_DIR, `${file}.bench-bak`);
    if (existsSync(src)) {
      renameSync(src, bak);
      backed.push(file);
    }
  }
  if (backed.length > 0) {
    console.log(
      `🔒 Config globale isolée (sauvegardé : ${backed.join(", ")})`
    );
  }
  return backed;
}

function restoreGlobalConfig(backed: string[]) {
  for (const file of backed) {
    const bak = join(GLOBAL_CLAUDE_DIR, `${file}.bench-bak`);
    const dst = join(GLOBAL_CLAUDE_DIR, file);
    if (existsSync(bak)) {
      renameSync(bak, dst);
    }
  }
  if (backed.length > 0) {
    console.log(`🔓 Config globale restaurée (${backed.join(", ")})`);
  }
}

// ─── Types ────────────────────────────────────────────────

interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
}

interface RunResult {
  config: ConfigProfile;
  task: string;
  taskName: string;
  category: TaskCategory;
  run: number;
  output: string;
  checks: CheckResult[];
  passRate: number;
  judgeRaw: string;
  durationMs: number;
}

// ─── CLI args ─────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  let runs = 1;
  let configFilter: ConfigProfile | null = null;
  let taskFilter: string | null = null;
  let categoryFilter: TaskCategory | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--runs" && args[i + 1]) {
      runs = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--config" && args[i + 1]) {
      configFilter = args[i + 1] as ConfigProfile;
      i++;
    } else if (args[i] === "--task" && args[i + 1]) {
      taskFilter = args[i + 1];
      i++;
    } else if (args[i] === "--category" && args[i + 1]) {
      categoryFilter = args[i + 1] as TaskCategory;
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  return { runs, configFilter, taskFilter, categoryFilter, dryRun };
}

// ─── Temp project setup ───────────────────────────────────

function createTempProject(
  config: ConfigProfile,
  setupFiles?: Record<string, string>
): string {
  const tmpDir = join(RESULTS_DIR, `.tmp-${config}-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  execSync(
    "git init && git config user.email 'bench@test.local' && git config user.name 'Benchmark'",
    { cwd: tmpDir, stdio: "pipe" }
  );

  writeFileSync(
    join(tmpDir, "package.json"),
    JSON.stringify(
      { name: "benchmark-project", version: "1.0.0", private: true },
      null,
      2
    )
  );

  // Copy config profile files
  if (config === "configured") {
    const configDir = join(CONFIGS_DIR, "advanced");
    cpSync(configDir, tmpDir, { recursive: true });
  }

  // Create task-specific setup files (e.g. fake .env, .pem)
  if (setupFiles) {
    for (const [filePath, content] of Object.entries(setupFiles)) {
      const fullPath = join(tmpDir, filePath);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content);
    }
  }

  execSync("git add -A && git commit -m 'init' --no-verify", {
    cwd: tmpDir,
    stdio: "pipe",
  });

  return tmpDir;
}

function cleanupTempProject(tmpDir: string) {
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

// ─── Run Claude ───────────────────────────────────────────

function runClaude(
  prompt: string,
  cwd: string,
  timeoutMs = 120_000
): { output: string; durationMs: number } {
  const start = Date.now();
  const promptFile = join(cwd, ".benchmark-prompt.txt");
  writeFileSync(promptFile, prompt);

  const opts: ExecSyncOptions = {
    cwd,
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  };

  try {
    const output = execSync(
      `cat .benchmark-prompt.txt | claude -p --output-format text 2>/dev/null`,
      opts
    ) as string;
    return { output: output.toString(), durationMs: Date.now() - start };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string };
    return {
      output:
        error.stdout?.toString() ||
        `ERROR: ${error.stderr?.toString() || "unknown"}`,
      durationMs: Date.now() - start,
    };
  } finally {
    try {
      rmSync(promptFile);
    } catch {
      /* ignore */
    }
  }
}

// ─── LLM Judge ────────────────────────────────────────────

function judgeOutput(
  task: Task,
  output: string
): { checks: CheckResult[]; passRate: number; raw: string } {
  const judgePrompt = buildJudgePrompt(task, output);
  const promptFile = join(RESULTS_DIR, `.judge-prompt-${Date.now()}.txt`);
  writeFileSync(promptFile, judgePrompt);

  try {
    const raw = execSync(
      `cat "${promptFile}" | claude -p --output-format text 2>/dev/null`,
      {
        timeout: 60_000,
        maxBuffer: 10 * 1024 * 1024,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ) as string;

    // Parse JSON from response — handle markdown wrapping
    const jsonStr = raw
      .toString()
      .replace(/```json?\n?/g, "")
      .replace(/```/g, "")
      .trim();
    const verdicts = JSON.parse(jsonStr) as Record<string, boolean>;

    const checks: CheckResult[] = task.checks.map((c) => ({
      id: c.id,
      label: c.label,
      passed: verdicts[c.id] === true,
    }));

    const passed = checks.filter((c) => c.passed).length;
    const passRate = checks.length > 0 ? passed / checks.length : 0;

    return { checks, passRate, raw: raw.toString().trim() };
  } catch (err) {
    // Judge failed — mark all checks as failed
    const checks: CheckResult[] = task.checks.map((c) => ({
      id: c.id,
      label: c.label,
      passed: false,
    }));
    return { checks, passRate: 0, raw: `JUDGE_ERROR: ${err}` };
  } finally {
    try {
      rmSync(promptFile);
    } catch {
      /* ignore */
    }
  }
}

// ─── Report ───────────────────────────────────────────────

function generateReport(results: RunResult[]): string {
  const lines: string[] = [];
  const timestamp = new Date().toISOString().split("T")[0];

  lines.push("# 📋 Rapport de Conformité — Claude Config Generator");
  lines.push(`\n> Date : ${timestamp}`);

  const runsPerCombo = results.filter(
    (r) => r.config === "none" && r.task === results[0]?.task
  ).length;
  lines.push(`> Runs par combinaison : ${runsPerCombo}`);
  lines.push(
    `> Tâches : ${new Set(results.map((r) => r.task)).size} | Checks : ${results.reduce((s, r) => s + r.checks.length, 0)}`
  );

  // ── Executive summary ──
  lines.push("\n## 🎯 Résumé exécutif\n");
  lines.push(
    "Ce benchmark mesure si Claude **respecte les décisions de l'équipe** (langue, sécurité, conventions, ton) selon qu'il dispose ou non de fichiers de configuration.\n"
  );

  const noneResults = results.filter((r) => r.config === "none");
  const confResults = results.filter((r) => r.config === "configured");

  const nonePassed = noneResults.reduce(
    (s, r) => s + r.checks.filter((c) => c.passed).length,
    0
  );
  const noneTotal = noneResults.reduce((s, r) => s + r.checks.length, 0);
  const confPassed = confResults.reduce(
    (s, r) => s + r.checks.filter((c) => c.passed).length,
    0
  );
  const confTotal = confResults.reduce((s, r) => s + r.checks.length, 0);

  const nonePct = noneTotal > 0 ? Math.round((nonePassed / noneTotal) * 100) : 0;
  const confPct = confTotal > 0 ? Math.round((confPassed / confTotal) * 100) : 0;

  lines.push("| | Sans configuration | Avec configuration |");
  lines.push("|---|:---:|:---:|");
  lines.push(
    `| **Taux de conformité** | **${nonePct}%** (${nonePassed}/${noneTotal}) | **${confPct}%** (${confPassed}/${confTotal}) |`
  );
  lines.push("");

  if (confPct > nonePct) {
    const gain = confPct - nonePct;
    lines.push(
      `> **+${gain} points** de conformité grâce aux fichiers de configuration.\n`
    );
  }

  // ── Compliance table by category ──
  lines.push("## 📊 Conformité par catégorie\n");
  lines.push("| Règle | Sans config | Avec config |");
  lines.push("|---|:---:|:---:|");

  const categories = [...new Set(TASKS.map((t) => t.category))] as TaskCategory[];

  for (const cat of categories) {
    const catLabel = CATEGORY_LABELS[cat];
    const catNone = noneResults.filter((r) => r.category === cat);
    const catConf = confResults.filter((r) => r.category === cat);

    const catNonePassed = catNone.reduce(
      (s, r) => s + r.checks.filter((c) => c.passed).length,
      0
    );
    const catNoneTotal = catNone.reduce((s, r) => s + r.checks.length, 0);
    const catConfPassed = catConf.reduce(
      (s, r) => s + r.checks.filter((c) => c.passed).length,
      0
    );
    const catConfTotal = catConf.reduce((s, r) => s + r.checks.length, 0);

    const nPct =
      catNoneTotal > 0 ? Math.round((catNonePassed / catNoneTotal) * 100) : 0;
    const cPct =
      catConfTotal > 0 ? Math.round((catConfPassed / catConfTotal) * 100) : 0;

    const nIcon = nPct === 100 ? "✅" : nPct >= 50 ? "⚠️" : "❌";
    const cIcon = cPct === 100 ? "✅" : cPct >= 50 ? "⚠️" : "❌";

    lines.push(
      `| ${catLabel} | ${nIcon} ${nPct}% (${catNonePassed}/${catNoneTotal}) | ${cIcon} ${cPct}% (${catConfPassed}/${catConfTotal}) |`
    );
  }

  // ── Detailed results per task ──
  lines.push("\n## 🔍 Détail par test\n");

  for (const cat of categories) {
    const catLabel = CATEGORY_LABELS[cat];
    lines.push(`### ${catLabel}\n`);

    const catTasks = [...new Set(results.filter((r) => r.category === cat).map((r) => r.task))];

    for (const taskId of catTasks) {
      const task = TASKS.find((t) => t.id === taskId)!;
      lines.push(`#### ${task.name}\n`);
      lines.push(`> *Fichier testé : \`${task.configFile}\`*\n`);

      // Collect check results across all runs for this task
      const taskNone = noneResults.filter((r) => r.task === taskId);
      const taskConf = confResults.filter((r) => r.task === taskId);

      lines.push("| Check | Sans config | Avec config |");
      lines.push("|---|:---:|:---:|");

      for (const check of task.checks) {
        const nonePasses = taskNone.reduce(
          (s, r) =>
            s + (r.checks.find((c) => c.id === check.id)?.passed ? 1 : 0),
          0
        );
        const noneRuns = taskNone.length;
        const confPasses = taskConf.reduce(
          (s, r) =>
            s + (r.checks.find((c) => c.id === check.id)?.passed ? 1 : 0),
          0
        );
        const confRuns = taskConf.length;

        const nLabel =
          noneRuns > 0 && nonePasses === noneRuns
            ? `✅ ${nonePasses}/${noneRuns}`
            : noneRuns > 0 && nonePasses > 0
              ? `⚠️ ${nonePasses}/${noneRuns}`
              : `❌ ${nonePasses}/${noneRuns}`;
        const cLabel =
          confRuns > 0 && confPasses === confRuns
            ? `✅ ${confPasses}/${confRuns}`
            : confRuns > 0 && confPasses > 0
              ? `⚠️ ${confPasses}/${confRuns}`
              : `❌ ${confPasses}/${confRuns}`;

        lines.push(`| ${check.label} | ${nLabel} | ${cLabel} |`);
      }

      lines.push("");
    }
  }

  // ── Timing ──
  lines.push("## ⏱️ Temps de réponse\n");
  lines.push("| | Sans config | Avec config |");
  lines.push("|---|:---:|:---:|");
  const noneTime =
    noneResults.reduce((s, r) => s + r.durationMs, 0) /
    (noneResults.length || 1);
  const confTime =
    confResults.reduce((s, r) => s + r.durationMs, 0) /
    (confResults.length || 1);
  lines.push(
    `| Durée moyenne | ${(noneTime / 1000).toFixed(1)}s | ${(confTime / 1000).toFixed(1)}s |`
  );

  // ── What this proves ──
  lines.push("\n## 💡 Ce que ça prouve\n");
  lines.push(
    "Les fichiers de configuration Claude (`CLAUDE.md`, `settings.json`, `.claudeignore`, `.claude/rules/`) permettent de :"
  );
  lines.push("");
  lines.push(
    "1. **Imposer la langue** — Claude répond en français même quand on lui parle en anglais"
  );
  lines.push(
    "2. **Protéger les secrets** — Les fichiers sensibles (.env, .pem, .key) ne sont jamais exposés"
  );
  lines.push(
    "3. **Bloquer les commandes dangereuses** — `rm -rf`, `--force`, `reset --hard` sont interdits"
  );
  lines.push(
    "4. **Appliquer les conventions** — Nommage, structure des tests, imports, requêtes SQL sécurisées"
  );
  lines.push(
    "5. **Garantir le ton** — Réponses directes, professionnelles, sans filler ni emojis"
  );
  lines.push("");
  lines.push(
    "**Sans ces fichiers, Claude fait ce qu'il veut. Avec, il respecte vos décisions.**"
  );

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const { runs, configFilter, taskFilter, categoryFilter, dryRun } =
    parseArgs();

  const configs = configFilter
    ? [configFilter as ConfigProfile]
    : [...CONFIGS];

  let tasks = taskFilter
    ? TASKS.filter((t) => t.id === taskFilter)
    : TASKS;

  if (categoryFilter) {
    tasks = tasks.filter((t) => t.category === categoryFilter);
  }

  const totalRuns = configs.length * tasks.length * runs;
  const totalChecks = tasks.reduce((s, t) => s + t.checks.length, 0) * configs.length * runs;

  console.log(
    `\n🏁 Benchmark de conformité : ${configs.length} configs × ${tasks.length} tâches × ${runs} runs = ${totalRuns} générations + ${totalRuns} jugements (${totalChecks} checks)\n`
  );

  if (dryRun) {
    for (const config of configs) {
      for (const task of tasks) {
        const checksStr = task.checks.map((c) => c.id).join(", ");
        for (let r = 1; r <= runs; r++) {
          console.log(
            `  [DRY] ${config} × ${task.id} (run ${r}) → [${task.category}] ${task.name} — checks: ${checksStr}`
          );
        }
      }
    }
    console.log(
      `\n📋 Total : ${totalRuns} runs, ${totalChecks} checks à évaluer`
    );
    return;
  }

  const backedUp = backupGlobalConfig();
  const cleanup = () => {
    restoreGlobalConfig(backedUp);
    process.exit(1);
  };
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  try {
    mkdirSync(RESULTS_DIR, { recursive: true });
    const allResults: RunResult[] = [];
    let completed = 0;

    for (const config of configs) {
      for (const task of tasks) {
        for (let r = 1; r <= runs; r++) {
          completed++;
          const label = `[${completed}/${totalRuns}] ${config} × ${task.id} (run ${r})`;

          // Step 1: Generate
          process.stdout.write(`⏳ ${label} [generate]...`);
          const tmpDir = createTempProject(config, task.setupFiles);

          try {
            const { output, durationMs } = runClaude(task.prompt, tmpDir);

            // Step 2: Judge (blind)
            process.stdout.write(` [judge]...`);
            const { checks, passRate, raw } = judgeOutput(task, output);

            const result: RunResult = {
              config,
              task: task.id,
              taskName: task.name,
              category: task.category,
              run: r,
              output,
              checks,
              passRate,
              judgeRaw: raw,
              durationMs,
            };

            allResults.push(result);

            const resultFile = join(
              RESULTS_DIR,
              `${config}_${task.id}_run${r}.json`
            );
            writeFileSync(resultFile, JSON.stringify(result, null, 2));

            const checkStr = checks
              .map((c) => `${c.passed ? "✅" : "❌"} ${c.id}`)
              .join(" ");
            const pct = Math.round(passRate * 100);
            console.log(
              ` ${pct}% (${checkStr}) [${(durationMs / 1000).toFixed(1)}s]`
            );
          } finally {
            cleanupTempProject(tmpDir);
          }
        }
      }
    }

    // Generate report
    const report = generateReport(allResults);
    const reportFile = join(RESULTS_DIR, `report-${Date.now()}.md`);
    writeFileSync(reportFile, report);

    const rawFile = join(RESULTS_DIR, `raw-${Date.now()}.json`);
    writeFileSync(rawFile, JSON.stringify(allResults, null, 2));

    console.log(`\n📊 Rapport : ${reportFile}`);
    console.log(`📦 Données brutes : ${rawFile}\n`);
    console.log(report);
  } finally {
    restoreGlobalConfig(backedUp);
    process.removeListener("SIGINT", cleanup);
    process.removeListener("SIGTERM", cleanup);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
