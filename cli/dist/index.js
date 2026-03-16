#!/usr/bin/env node

// index.ts
var VERSION = "0.1.0";
var API_BASE = "https://extractvibe.com/api";
var VALID_FORMATS = ["json", "css", "tailwind", "markdown", "tokens"];
var POLL_INTERVAL_MS = 1500;
var POLL_TIMEOUT_MS = 12e4;
var isTTY = process.stdout.isTTY ?? false;
var ansi = {
  reset: isTTY ? "\x1B[0m" : "",
  bold: isTTY ? "\x1B[1m" : "",
  dim: isTTY ? "\x1B[2m" : "",
  green: isTTY ? "\x1B[32m" : "",
  cyan: isTTY ? "\x1B[36m" : "",
  yellow: isTTY ? "\x1B[33m" : "",
  red: isTTY ? "\x1B[31m" : "",
  gray: isTTY ? "\x1B[90m" : "",
  white: isTTY ? "\x1B[37m" : "",
  clearLine: isTTY ? "\x1B[2K" : "",
  cursorUp: isTTY ? "\x1B[1A" : ""
};
function green(s) {
  return `${ansi.green}${s}${ansi.reset}`;
}
function cyan(s) {
  return `${ansi.cyan}${s}${ansi.reset}`;
}
function red(s) {
  return `${ansi.red}${s}${ansi.reset}`;
}
function bold(s) {
  return `${ansi.bold}${s}${ansi.reset}`;
}
function dim(s) {
  return `${ansi.dim}${s}${ansi.reset}`;
}
var SPINNER_FRAMES = ["\u25D0", "\u25D3", "\u25D1", "\u25D2"];
var Spinner = class {
  frameIndex = 0;
  timer = null;
  label;
  startTime;
  constructor(label) {
    this.label = label;
    this.startTime = Date.now();
  }
  start() {
    if (!isTTY) {
      process.stdout.write(`  ... ${this.label}
`);
      return;
    }
    this.render();
    this.timer = setInterval(() => this.render(), 100);
  }
  render() {
    const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length];
    const elapsed = ((Date.now() - this.startTime) / 1e3).toFixed(1);
    process.stdout.write(
      `${ansi.clearLine}\r  ${cyan(frame)} ${this.label} ${dim(`(${elapsed}s)`)}`
    );
    this.frameIndex++;
  }
  succeed() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const elapsed = ((Date.now() - this.startTime) / 1e3).toFixed(1);
    const line = `  ${green("\u2713")} ${this.label} ${dim(`(${elapsed}s)`)}`;
    if (isTTY) {
      process.stdout.write(`${ansi.clearLine}\r${line}
`);
    } else {
      process.stdout.write(`${line}
`);
    }
    return elapsed;
  }
  fail(message) {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const elapsed = ((Date.now() - this.startTime) / 1e3).toFixed(1);
    const suffix = message ? ` \u2014 ${message}` : "";
    const line = `  ${red("\u2717")} ${this.label} ${dim(`(${elapsed}s)`)}${red(suffix)}`;
    if (isTTY) {
      process.stdout.write(`${ansi.clearLine}\r${line}
`);
    } else {
      process.stdout.write(`${line}
`);
    }
  }
};
function parseArgs(argv) {
  const result = {
    url: null,
    format: "json",
    output: null,
    apiKey: null,
    help: false,
    version: false
  };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      i++;
      continue;
    }
    if (arg === "--version" || arg === "-v") {
      result.version = true;
      i++;
      continue;
    }
    if (arg === "--format" || arg === "-f") {
      const next = argv[++i];
      if (!next || next.startsWith("-")) {
        fatal("--format requires a value: json, css, tailwind, markdown, or tokens");
      }
      if (!VALID_FORMATS.includes(next)) {
        fatal(
          `Invalid format "${next}". Valid formats: ${VALID_FORMATS.join(", ")}`
        );
      }
      result.format = next;
      i++;
      continue;
    }
    if (arg === "--output" || arg === "-o") {
      const next = argv[++i];
      if (!next || next.startsWith("-")) {
        fatal("--output requires a file path");
      }
      result.output = next;
      i++;
      continue;
    }
    if (arg === "--api-key" || arg === "--key") {
      const next = argv[++i];
      if (!next || next.startsWith("-")) {
        fatal("--api-key requires a value");
      }
      result.apiKey = next;
      i++;
      continue;
    }
    if (arg.startsWith("-")) {
      fatal(`Unknown flag: ${arg}

Run ${bold("extractvibe --help")} for usage.`);
    }
    if (!result.url) {
      result.url = arg;
    } else {
      fatal(`Unexpected argument: ${arg}`);
    }
    i++;
  }
  return result;
}
function printHelp() {
  console.log(`
  ${bold("extractvibe")} ${dim(`v${VERSION}`)} \u2014 Extract brand kits from any website

  ${bold("Usage:")}
    extractvibe <url>                           Extract a brand kit (JSON)
    extractvibe <url> --format <fmt>            Export in a specific format
    extractvibe <url> --output <path>           Save to a file
    extractvibe <url> --api-key <key>           Authenticate with an API key

  ${bold("Formats:")}
    json        Full brand kit (default)
    css         CSS custom properties
    tailwind    Tailwind v4 @theme block
    markdown    Brand report document
    tokens      W3C Design Tokens (JSON)

  ${bold("Options:")}
    --format, -f <fmt>    Export format (default: json)
    --output, -o <path>   Write to file (default: <domain>-brand-kit.<ext>)
    --api-key, --key      API key (or set EXTRACTVIBE_API_KEY env var)
    --help, -h            Show this help
    --version, -v         Show version

  ${bold("Examples:")}
    ${dim("$")} extractvibe https://stripe.com
    ${dim("$")} extractvibe https://linear.app --format tailwind --output theme.css
    ${dim("$")} extractvibe https://vercel.com --format markdown
    ${dim("$")} EXTRACTVIBE_API_KEY=ev_abc123 extractvibe https://notion.so

  ${bold("Authentication:")}
    Get a free API key at ${cyan("https://extractvibe.com/dashboard")}
    Pass it via --api-key or the EXTRACTVIBE_API_KEY environment variable.
`);
}
function printVersion() {
  console.log(`extractvibe v${VERSION}`);
}
function fatal(message) {
  console.error(`
  ${red("\u2717")} ${message}
`);
  process.exit(1);
}
function normalizeUrl(input) {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      fatal(`Invalid protocol "${parsed.protocol}" \u2014 only http and https are supported.`);
    }
    if (!parsed.hostname.includes(".")) {
      fatal(`Invalid URL "${input}" \u2014 must be a valid domain (e.g. stripe.com).`);
    }
    return parsed.toString();
  } catch {
    fatal(`Invalid URL: "${input}"

  Example: extractvibe https://stripe.com`);
  }
}
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "brand";
  }
}
function getFileExtension(format) {
  switch (format) {
    case "json":
      return "json";
    case "css":
      return "css";
    case "tailwind":
      return "css";
    case "markdown":
      return "md";
    case "tokens":
      return "json";
  }
}
function getDefaultFilename(domain, format) {
  const ext = getFileExtension(format);
  switch (format) {
    case "json":
      return `${domain}-brand-kit.json`;
    case "css":
      return `${domain}-variables.css`;
    case "tailwind":
      return `${domain}-tailwind-theme.css`;
    case "markdown":
      return `${domain}-brand-report.md`;
    case "tokens":
      return `${domain}-design-tokens.json`;
    default:
      return `${domain}-brand-kit.${ext}`;
  }
}
async function apiRequest(path, options) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "x-api-key": options.apiKey,
    "User-Agent": `extractvibe-cli/${VERSION}`
  };
  const fetchOptions = {
    method: options.method || "GET",
    headers
  };
  if (options.body) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(options.body);
  }
  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new Error(`Network error: ${message}`);
  }
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
    }
    const errorMessage = errorBody?.error || `HTTP ${response.status}`;
    switch (response.status) {
      case 401:
        throw new Error(
          `Authentication failed: ${errorMessage}

  Make sure your API key is valid.
  Get one at ${cyan("https://extractvibe.com/dashboard")}`
        );
      case 402:
        throw new Error(
          `No credits remaining.

  Top up at ${cyan("https://extractvibe.com/pricing")}`
        );
      case 400:
        throw new Error(`Bad request: ${errorMessage}`);
      case 404:
        throw new Error(`Not found: ${errorMessage}`);
      case 429:
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      default:
        throw new Error(`API error (${response.status}): ${errorMessage}`);
    }
  }
  return response.json();
}
async function apiRequestRaw(path, apiKey) {
  const url = `${API_BASE}${path}`;
  const headers = {
    "x-api-key": apiKey,
    "User-Agent": `extractvibe-cli/${VERSION}`
  };
  let response;
  try {
    response = await fetch(url, { headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    throw new Error(`Network error: ${message}`);
  }
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {
    }
    const errorMessage = errorBody?.error || `HTTP ${response.status}`;
    throw new Error(`Export failed (${response.status}): ${errorMessage}`);
  }
  return response.text();
}
var STEP_LABELS = {
  "fetch-render": "Fetching & rendering",
  "fetch": "Fetching & rendering",
  "parse-assets": "Parsing visual identity",
  "visual": "Parsing visual identity",
  "analyze-voice": "Analyzing brand voice",
  "voice": "Analyzing brand voice",
  "synthesize-vibe": "Synthesizing vibe",
  "vibe": "Synthesizing vibe",
  "score-package": "Packaging results",
  "package": "Packaging results"
};
var PIPELINE_STEPS = [
  "fetch",
  "visual",
  "voice",
  "vibe",
  "package"
];
async function pollJobToCompletion(jobId, apiKey) {
  const completedSteps = /* @__PURE__ */ new Set();
  let currentSpinner = null;
  let currentStep = null;
  const startTime = Date.now();
  const firstLabel = STEP_LABELS[PIPELINE_STEPS[0]] || "Starting extraction";
  currentSpinner = new Spinner(firstLabel);
  currentStep = PIPELINE_STEPS[0];
  currentSpinner.start();
  while (true) {
    if (Date.now() - startTime > POLL_TIMEOUT_MS) {
      if (currentSpinner) currentSpinner.fail("Timed out");
      throw new Error(
        "Extraction timed out after 2 minutes. The job may still be processing \u2014 check your dashboard."
      );
    }
    await sleep(POLL_INTERVAL_MS);
    let statusResponse;
    try {
      statusResponse = await apiRequest(`/extract/${jobId}`, { apiKey });
    } catch (err) {
      continue;
    }
    const status = statusResponse?.status;
    if (status === "complete" || status?.status === "complete") {
      for (const step of PIPELINE_STEPS) {
        if (!completedSteps.has(step)) {
          if (currentSpinner && currentStep === step) {
            currentSpinner.succeed();
          } else if (!completedSteps.has(step)) {
            const label = STEP_LABELS[step] || step;
            const s = new Spinner(label);
            s.start();
            s.succeed();
          }
          completedSteps.add(step);
        }
      }
      return { success: true, jobId };
    }
    if (status === "errored" || status?.status === "errored") {
      if (currentSpinner) {
        currentSpinner.fail("Extraction failed");
      }
      const errorMsg = status?.error || status?.output?.error || "Unknown extraction error";
      throw new Error(`Extraction failed: ${errorMsg}`);
    }
    if (status === "running" || status?.status === "running") {
      const output = status?.output || statusResponse?.output;
      if (output && typeof output === "object") {
        for (const step of PIPELINE_STEPS) {
          if (completedSteps.has(step)) continue;
          const stepDone = output[step] === "complete" || output?.steps?.[step] === "complete";
          if (stepDone) {
            if (currentSpinner && currentStep === step) {
              currentSpinner.succeed();
            }
            completedSteps.add(step);
            const nextIdx = PIPELINE_STEPS.indexOf(step) + 1;
            if (nextIdx < PIPELINE_STEPS.length) {
              const nextStep = PIPELINE_STEPS[nextIdx];
              const nextLabel = STEP_LABELS[nextStep] || nextStep;
              currentSpinner = new Spinner(nextLabel);
              currentStep = nextStep;
              currentSpinner.start();
            }
          }
        }
      }
    }
  }
}
function summarizeBrandKit(kit) {
  const brandName = kit?.identity?.brandName || null;
  let colorCount = 0;
  const lightMode = kit?.colors?.lightMode;
  if (lightMode) {
    colorCount += Object.values(lightMode).filter(
      (c) => c && c.hex
    ).length;
  }
  const darkMode = kit?.colors?.darkMode;
  if (darkMode) {
    colorCount += Object.values(darkMode).filter(
      (c) => c && c.hex
    ).length;
  }
  const rawPalette = kit?.colors?.rawPalette;
  if (Array.isArray(rawPalette) && rawPalette.length > colorCount) {
    colorCount = rawPalette.length;
  }
  const primaryColor = lightMode?.primary?.hex || null;
  const fontNames = (kit?.typography?.families || []).map((f) => f.name).filter(Boolean);
  const vibeSummary = kit?.vibe?.summary || null;
  const dosCount = kit?.rules?.dos?.length || 0;
  const dontsCount = kit?.rules?.donts?.length || 0;
  return {
    brandName,
    colorCount,
    primaryColor,
    fontNames,
    vibeSummary,
    dosCount,
    dontsCount
  };
}
function printSummary(summary) {
  console.log("");
  if (summary.brandName) {
    console.log(`  ${bold("Brand:")} ${summary.brandName}`);
  }
  if (summary.colorCount > 0) {
    const primaryNote = summary.primaryColor ? ` ${dim(`(primary: ${summary.primaryColor})`)}` : "";
    console.log(
      `  ${bold("Colors:")} ${summary.colorCount}${primaryNote}`
    );
  }
  if (summary.fontNames.length > 0) {
    console.log(
      `  ${bold("Fonts:")} ${summary.fontNames.join(", ")}`
    );
  }
  if (summary.vibeSummary) {
    const maxLen = 60;
    const truncated = summary.vibeSummary.length > maxLen ? summary.vibeSummary.substring(0, maxLen - 3) + "..." : summary.vibeSummary;
    console.log(`  ${bold("Vibe:")} ${dim('"')}${truncated}${dim('"')}`);
  }
  if (summary.dosCount > 0 || summary.dontsCount > 0) {
    console.log(
      `  ${bold("Rules:")} ${summary.dosCount} DOs, ${summary.dontsCount} DON'Ts`
    );
  }
}
async function writeFile(filePath, content) {
  const { writeFile: fsWrite } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const resolved = resolve(filePath);
  await fsWrite(resolved, content, "utf-8");
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    process.exit(0);
  }
  if (args.version) {
    printVersion();
    process.exit(0);
  }
  if (!args.url) {
    printHelp();
    process.exit(1);
  }
  const apiKey = args.apiKey || process.env.EXTRACTVIBE_API_KEY || null;
  if (!apiKey) {
    fatal(
      `API key required.

  Pass ${bold("--api-key <key>")} or set the ${bold("EXTRACTVIBE_API_KEY")} environment variable.

  Get a free API key at ${cyan("https://extractvibe.com/dashboard")}`
    );
  }
  const url = normalizeUrl(args.url);
  const domain = getDomainFromUrl(url);
  console.log("");
  console.log(
    `  ${bold("extractvibe")} ${dim(`v${VERSION}`)}`
  );
  console.log("");
  console.log(`  ${bold("Extracting:")} ${cyan(domain)}`);
  const totalStart = Date.now();
  let jobId;
  try {
    const response = await apiRequest(
      "/extract",
      {
        method: "POST",
        body: { url },
        apiKey
      }
    );
    jobId = response.jobId;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start extraction";
    fatal(message);
  }
  try {
    await pollJobToCompletion(jobId, apiKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    fatal(message);
  }
  const totalElapsed = ((Date.now() - totalStart) / 1e3).toFixed(1);
  console.log("");
  console.log(`  ${green("\u2713")} ${bold("Done")} ${dim(`in ${totalElapsed}s`)}`);
  let resultContent;
  let brandKit = null;
  try {
    if (args.format === "json") {
      brandKit = await apiRequest(`/extract/${jobId}/result`, { apiKey });
      resultContent = JSON.stringify(brandKit, null, 2);
    } else {
      resultContent = await apiRequestRaw(
        `/extract/${jobId}/export/${args.format}`,
        apiKey
      );
      try {
        brandKit = await apiRequest(`/extract/${jobId}/result`, {
          apiKey
        });
      } catch {
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch results";
    fatal(message);
  }
  if (brandKit) {
    const summary = summarizeBrandKit(brandKit);
    printSummary(summary);
  }
  const outputPath = args.output || getDefaultFilename(domain, args.format);
  try {
    await writeFile(outputPath, resultContent);
    console.log("");
    console.log(`  Saved to ${cyan(outputPath)}`);
    console.log("");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write file";
    fatal(`Could not write to ${outputPath}: ${message}`);
  }
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  fatal(`Unexpected error: ${message}`);
});
