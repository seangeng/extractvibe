#!/usr/bin/env node
// ExtractVibe pipeline benchmark harness.
// Runs N URLs sequentially against prod, captures total + per-step timings + full kit JSON.
// Usage: node bench/run-bench.mjs [label]
//   label: directory suffix (default: timestamp). Use "baseline" for first run.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const API = "https://extractvibe.com";
const KEY = readFileSync(join(__dirname, ".bench-key"), "utf8").trim();

// Original 12 (kept for legacy / regression checks)
const ORIGINAL_URLS = [
  "https://linear.app",
  "https://vercel.com",
  "https://stripe.com",
  "https://shopify.com",
  "https://notion.so",
  "https://github.com",
  "https://figma.com",
  "https://ramp.com",
  "https://airbnb.com",
  "https://basecamp.com",
  "https://coca-cola.com",
  "https://nytimes.com",
];

// 20 fresh URLs covering AI, dev tools, fintech, infra, retail, content,
// design, education, wellness, automotive — diverse enough to stress
// every extractor path (logos, color synthesis, voice, vibe, brand kit
// discovery, LoadLogo lookup, OG images, dark mode detection).
const URLS_20 = [
  "https://anthropic.com",
  "https://openai.com",
  "https://perplexity.ai",
  "https://cursor.sh",
  "https://supabase.com",
  "https://cloudflare.com",
  "https://mongodb.com",
  "https://postman.com",
  "https://webflow.com",
  "https://framer.com",
  "https://discord.com",
  "https://slack.com",
  "https://dropbox.com",
  "https://zoom.us",
  "https://duolingo.com",
  "https://headspace.com",
  "https://patagonia.com",
  "https://nike.com",
  "https://apple.com",
  "https://tesla.com",
];

// Default: 20-URL set. Pass --legacy to use the original 12.
const URLS = process.argv.includes("--legacy") ? ORIGINAL_URLS : URLS_20;

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const label = args[0] || `run-${Date.now()}`;
const OUT = join(__dirname, label);
mkdirSync(join(OUT, "kits"), { recursive: true });

function nowIso() { return new Date().toISOString(); }

async function startExtract(url) {
  const res = await fetch(`${API}/api/extract`, {
    method: "POST",
    headers: { "x-api-key": KEY, "content-type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(`extract start ${url}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function pollStatus(jobId) {
  // Retry transient 5xx — workflow instance API has eventual consistency
  // after create. First poll can fire before propagation.
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`${API}/api/extract/${jobId}`, {
        headers: { "x-api-key": KEY },
      });
      if (res.ok) return res.json();
      if (res.status >= 500) {
        lastErr = new Error(`poll ${jobId}: ${res.status}`);
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw new Error(`poll ${jobId}: ${res.status} ${await res.text()}`);
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw lastErr || new Error(`poll ${jobId}: exhausted retries`);
}

async function fetchResult(jobId) {
  const res = await fetch(`${API}/api/extract/${jobId}/result`, {
    headers: { "x-api-key": KEY },
  });
  if (!res.ok) return null;
  return res.json();
}

function describeInstance(jobId) {
  try {
    const out = execSync(
      `npx wrangler workflows instances describe extract-brand-workflow ${jobId} 2>&1`,
      { encoding: "utf8", cwd: ROOT, maxBuffer: 4 * 1024 * 1024 }
    );
    return parseDescribe(out);
  } catch (err) {
    return { error: String(err.message || err) };
  }
}

function parseDescribe(text) {
  const lines = text.split("\n");
  const steps = [];
  let total = null;
  let success = null;
  let current = null;

  // parse total duration
  for (const line of lines) {
    const m = line.match(/^Duration:\s+(.+)$/);
    if (m && total === null) {
      total = parseDurationLabel(m[1].trim());
      break;
    }
  }
  for (const line of lines) {
    const m = line.match(/^Success:\s+(.+)$/);
    if (m && success === null) {
      success = m[1].includes("Yes");
      break;
    }
  }
  // parse steps (look for "Name: foo" then nearest "Duration: X seconds")
  for (let i = 0; i < lines.length; i++) {
    const nm = lines[i].match(/^\s*Name:\s+(\S+)/);
    if (!nm) continue;
    let durSec = null;
    let stepSuccess = null;
    for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
      const dm = lines[j].match(/^\s*Duration:\s+(.+)$/);
      if (dm && durSec === null) durSec = parseDurationLabel(dm[1].trim());
      const sm = lines[j].match(/^\s*Success:\s+(.+)$/);
      if (sm && stepSuccess === null) stepSuccess = sm[1].includes("Yes");
      if (durSec !== null && stepSuccess !== null) break;
    }
    steps.push({ name: nm[1], durationMs: durSec, success: stepSuccess });
  }
  return { totalMs: total, success, steps };
}

function parseDurationLabel(label) {
  // formats: "12 seconds", "1 minute 5 seconds", "30 seconds", "5 minutes 12 seconds"
  let ms = 0;
  const minM = label.match(/(\d+)\s*minute/);
  if (minM) ms += parseInt(minM[1]) * 60_000;
  const secM = label.match(/(\d+)\s*second/);
  if (secM) ms += parseInt(secM[1]) * 1000;
  return ms || null;
}

async function runOne(url, idx) {
  const startTs = Date.now();
  const log = (msg) => console.log(`[${idx + 1}/${URLS.length}] ${url}: ${msg}`);
  log("starting");

  let jobId = null;
  let domain = null;
  try {
    const start = await startExtract(url);
    jobId = start.jobId;
    domain = start.domain || new URL(url).hostname.replace(/^www\./, "");
    log(`jobId=${jobId}`);

    let last = null;
    let timedOut = false;
    const pollStart = Date.now();
    // Initial delay to let workflow instance propagate to status API
    await new Promise((r) => setTimeout(r, 4000));
    while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const status = await pollStatus(jobId);
      last = status;
      const wfState = status?.status?.status;
      const dbState = status?.dbStatus;
      if (wfState === "complete" || wfState === "failed" || wfState === "errored" || wfState === "terminated") break;
      if (dbState === "complete" || dbState === "failed") break;
    }
    if (Date.now() - pollStart >= POLL_TIMEOUT_MS) {
      timedOut = true;
      log(`TIMEOUT after ${(POLL_TIMEOUT_MS / 1000).toFixed(0)}s — terminating workflow and skipping`);
      try {
        execSync(`npx wrangler workflows instances terminate extract-brand-workflow ${jobId}`, { cwd: ROOT, stdio: "ignore", timeout: 30_000 });
      } catch { /* non-fatal */ }
    }

    const wallMs = Date.now() - startTs;
    const kit = await fetchResult(jobId);

    // Wait briefly before describing — workflow indexer can lag
    await new Promise((r) => setTimeout(r, 3000));
    const wf = describeInstance(jobId);

    const summary = {
      url,
      domain,
      jobId,
      timedOut,
      finalStatus: timedOut ? "timeout" : (last?.status?.status || last?.dbStatus || "unknown"),
      wallClockMs: wallMs,
      workflowTotalMs: wf.totalMs,
      workflowSuccess: wf.success,
      stepTimings: wf.steps,
      qualityScore: kit?.meta?.qualityScore ?? null,
      kitDurationMs: kit?.meta?.durationMs ?? null,
      logosFound: kit?.logos?.length ?? 0,
      colorsFound: kit?.colors?.rawPalette?.length ?? 0,
      fontsFound: kit?.typography?.families?.length ?? 0,
      voiceSamples: kit?.voice?.sampleCopy?.length ?? 0,
      hasOfficialKit: !!kit?.officialGuidelines?.hasOfficialKit,
      vibeConfidence: kit?.vibe?.confidence ?? null,
      rulesDos: kit?.rules?.dos?.length ?? 0,
      rulesDonts: kit?.rules?.donts?.length ?? 0,
      brandName: kit?.identity?.brandName ?? null,
      timestamp: nowIso(),
    };

    if (kit) {
      writeFileSync(join(OUT, "kits", `${domain}.json`), JSON.stringify(kit, null, 2));
    }
    log(`done q=${summary.qualityScore} wall=${(wallMs / 1000).toFixed(1)}s wf=${wf.totalMs ? (wf.totalMs / 1000).toFixed(1) + "s" : "?"}`);
    return summary;
  } catch (err) {
    log(`ERROR: ${err.message}`);
    return {
      url,
      domain: domain || new URL(url).hostname,
      jobId,
      error: String(err.message || err),
      wallClockMs: Date.now() - startTs,
      timestamp: nowIso(),
    };
  }
}

(async () => {
  console.log(`Bench label: ${label}`);
  console.log(`Output: ${OUT}`);
  console.log(`URLs: ${URLS.length}\n`);

  const results = [];
  for (let i = 0; i < URLS.length; i++) {
    const r = await runOne(URLS[i], i);
    results.push(r);
    writeFileSync(join(OUT, "summary.json"), JSON.stringify(results, null, 2));
  }

  // Build markdown summary
  const md = [];
  md.push(`# Bench: ${label}\n`);
  md.push(`Run: ${nowIso()}\n`);
  md.push(`URLs: ${results.length}\n`);
  const successful = results.filter((r) => !r.error);
  const failed = results.filter((r) => r.error);
  md.push(`Successful: ${successful.length} / Failed: ${failed.length}\n`);

  if (successful.length > 0) {
    const wallTimes = successful.map((r) => r.wallClockMs).sort((a, b) => a - b);
    const wfTimes = successful.map((r) => r.workflowTotalMs).filter(Boolean).sort((a, b) => a - b);
    const median = (arr) => arr[Math.floor(arr.length / 2)];
    const p90 = (arr) => arr[Math.floor(arr.length * 0.9)];
    md.push(`\n## Latency\n`);
    md.push(`| Metric | Median | p90 | Min | Max |\n|---|---|---|---|---|`);
    md.push(`| Wall clock | ${(median(wallTimes) / 1000).toFixed(1)}s | ${(p90(wallTimes) / 1000).toFixed(1)}s | ${(wallTimes[0] / 1000).toFixed(1)}s | ${(wallTimes[wallTimes.length - 1] / 1000).toFixed(1)}s |`);
    if (wfTimes.length) {
      md.push(`| Workflow | ${(median(wfTimes) / 1000).toFixed(1)}s | ${(p90(wfTimes) / 1000).toFixed(1)}s | ${(wfTimes[0] / 1000).toFixed(1)}s | ${(wfTimes[wfTimes.length - 1] / 1000).toFixed(1)}s |`);
    }
  }

  md.push(`\n## Per-URL\n`);
  md.push(`| URL | Wall | WF | Q | Logos | Colors | Fonts | Voice | OffKit | Status |\n|---|---|---|---|---|---|---|---|---|---|`);
  for (const r of results) {
    md.push(`| ${r.domain} | ${r.wallClockMs ? (r.wallClockMs / 1000).toFixed(1) + "s" : "?"} | ${r.workflowTotalMs ? (r.workflowTotalMs / 1000).toFixed(1) + "s" : "?"} | ${r.qualityScore ?? "?"} | ${r.logosFound ?? "?"} | ${r.colorsFound ?? "?"} | ${r.fontsFound ?? "?"} | ${r.voiceSamples ?? "?"} | ${r.hasOfficialKit ? "Y" : "N"} | ${r.error ? "ERR" : r.finalStatus} |`);
  }

  // Per-step breakdown — discover step names from the first successful run
  // so renames in the workflow don't break the report.
  const allStepNames = Array.from(
    new Set(
      results.flatMap((r) =>
        (r.stepTimings || []).map((s) => (s.name || "").replace(/-\d+$/, ""))
      )
    )
  ).filter(Boolean);
  md.push(`\n## Per-step durations (seconds)\n`);
  md.push(`| URL | ${allStepNames.join(" | ")} |\n|${"---|".repeat(allStepNames.length + 1)}`);
  for (const r of results) {
    if (!r.stepTimings) {
      md.push(`| ${r.domain} |${" - |".repeat(allStepNames.length)}`);
      continue;
    }
    const cells = allStepNames.map((name) => {
      const s = r.stepTimings.find((s) => (s.name || "").replace(/-\d+$/, "") === name);
      return s?.durationMs ? (s.durationMs / 1000).toFixed(1) : "?";
    });
    md.push(`| ${r.domain} | ${cells.join(" | ")} |`);
  }

  // Step aggregate — same dynamic name discovery
  const stepNames = allStepNames;
  const aggregates = {};
  for (const name of stepNames) {
    const vals = successful
      .map((r) => r.stepTimings?.find((s) => (s.name || "").replace(/-\d+$/, "") === name)?.durationMs)
      .filter((v) => typeof v === "number")
      .sort((a, b) => a - b);
    if (!vals.length) continue;
    aggregates[name] = {
      median: vals[Math.floor(vals.length / 2)] / 1000,
      p90: vals[Math.floor(vals.length * 0.9)] / 1000,
      max: vals[vals.length - 1] / 1000,
      total: vals.reduce((a, b) => a + b, 0) / 1000,
    };
  }
  md.push(`\n## Step aggregate (across ${successful.length} successful)\n`);
  md.push(`| Step | Median | p90 | Max | Sum |\n|---|---|---|---|---|`);
  for (const name of stepNames) {
    const a = aggregates[name];
    if (!a) continue;
    md.push(`| ${name} | ${a.median.toFixed(1)}s | ${a.p90.toFixed(1)}s | ${a.max.toFixed(1)}s | ${a.total.toFixed(1)}s |`);
  }

  if (failed.length) {
    md.push(`\n## Failures\n`);
    for (const f of failed) md.push(`- ${f.domain}: ${f.error}`);
  }

  writeFileSync(join(OUT, "summary.md"), md.join("\n") + "\n");
  console.log(`\nWrote ${join(OUT, "summary.md")}`);
})().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
