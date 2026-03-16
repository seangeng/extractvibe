/**
 * ExtractVibe CLI
 *
 * Extract comprehensive brand kits from any website, right from the terminal.
 *
 * Usage:
 *   npx extractvibe <url>
 *   npx extractvibe <url> --format json|css|tailwind|markdown|tokens
 *   npx extractvibe <url> --output <filepath>
 *   npx extractvibe <url> --api-key <key>
 *   npx extractvibe --help
 *   npx extractvibe --version
 *
 * Zero runtime dependencies — uses only Node.js built-in fetch (Node 18+).
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const VERSION = "0.1.0";
const API_BASE = "https://extractvibe.com/api";
const VALID_FORMATS = ["json", "css", "tailwind", "markdown", "tokens"] as const;
type ExportFormat = (typeof VALID_FORMATS)[number];

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

// ─── ANSI Color Helpers ──────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY ?? false;

const ansi = {
  reset: isTTY ? "\x1b[0m" : "",
  bold: isTTY ? "\x1b[1m" : "",
  dim: isTTY ? "\x1b[2m" : "",
  green: isTTY ? "\x1b[32m" : "",
  cyan: isTTY ? "\x1b[36m" : "",
  yellow: isTTY ? "\x1b[33m" : "",
  red: isTTY ? "\x1b[31m" : "",
  gray: isTTY ? "\x1b[90m" : "",
  white: isTTY ? "\x1b[37m" : "",
  clearLine: isTTY ? "\x1b[2K" : "",
  cursorUp: isTTY ? "\x1b[1A" : "",
};

function green(s: string): string {
  return `${ansi.green}${s}${ansi.reset}`;
}
function cyan(s: string): string {
  return `${ansi.cyan}${s}${ansi.reset}`;
}
function yellow(s: string): string {
  return `${ansi.yellow}${s}${ansi.reset}`;
}
function red(s: string): string {
  return `${ansi.red}${s}${ansi.reset}`;
}
function bold(s: string): string {
  return `${ansi.bold}${s}${ansi.reset}`;
}
function dim(s: string): string {
  return `${ansi.dim}${s}${ansi.reset}`;
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["\u25D0", "\u25D3", "\u25D1", "\u25D2"];

class Spinner {
  private frameIndex = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private label: string;
  private startTime: number;

  constructor(label: string) {
    this.label = label;
    this.startTime = Date.now();
  }

  start(): void {
    if (!isTTY) {
      process.stdout.write(`  ... ${this.label}\n`);
      return;
    }
    this.render();
    this.timer = setInterval(() => this.render(), 100);
  }

  private render(): void {
    const frame = SPINNER_FRAMES[this.frameIndex % SPINNER_FRAMES.length];
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    process.stdout.write(
      `${ansi.clearLine}\r  ${cyan(frame)} ${this.label} ${dim(`(${elapsed}s)`)}`
    );
    this.frameIndex++;
  }

  succeed(): string {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const line = `  ${green("\u2713")} ${this.label} ${dim(`(${elapsed}s)`)}`;
    if (isTTY) {
      process.stdout.write(`${ansi.clearLine}\r${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
    return elapsed;
  }

  fail(message?: string): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const suffix = message ? ` — ${message}` : "";
    const line = `  ${red("\u2717")} ${this.label} ${dim(`(${elapsed}s)`)}${red(suffix)}`;
    if (isTTY) {
      process.stdout.write(`${ansi.clearLine}\r${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }
}

// ─── Arg Parsing ─────────────────────────────────────────────────────────────

interface ParsedArgs {
  url: string | null;
  format: ExportFormat;
  output: string | null;
  apiKey: string | null;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    url: null,
    format: "json",
    output: null,
    apiKey: null,
    help: false,
    version: false,
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
      if (!VALID_FORMATS.includes(next as ExportFormat)) {
        fatal(
          `Invalid format "${next}". Valid formats: ${VALID_FORMATS.join(", ")}`
        );
      }
      result.format = next as ExportFormat;
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
      fatal(`Unknown flag: ${arg}\n\nRun ${bold("extractvibe --help")} for usage.`);
    }

    // Positional argument — treat as URL
    if (!result.url) {
      result.url = arg;
    } else {
      fatal(`Unexpected argument: ${arg}`);
    }

    i++;
  }

  return result;
}

// ─── Help & Version ──────────────────────────────────────────────────────────

function printHelp(): void {
  console.log(`
  ${bold("extractvibe")} ${dim(`v${VERSION}`)} — Extract brand kits from any website

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

function printVersion(): void {
  console.log(`extractvibe v${VERSION}`);
}

// ─── Error Handling ──────────────────────────────────────────────────────────

function fatal(message: string): never {
  console.error(`\n  ${red("\u2717")} ${message}\n`);
  process.exit(1);
}

// ─── URL Validation ──────────────────────────────────────────────────────────

function normalizeUrl(input: string): string {
  let url = input.trim();

  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      fatal(`Invalid protocol "${parsed.protocol}" — only http and https are supported.`);
    }
    if (!parsed.hostname.includes(".")) {
      fatal(`Invalid URL "${input}" — must be a valid domain (e.g. stripe.com).`);
    }
    return parsed.toString();
  } catch {
    fatal(`Invalid URL: "${input}"\n\n  Example: extractvibe https://stripe.com`);
  }
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "brand";
  }
}

// ─── File Extension for Format ───────────────────────────────────────────────

function getFileExtension(format: ExportFormat): string {
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

function getDefaultFilename(domain: string, format: ExportFormat): string {
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

// ─── API Client ──────────────────────────────────────────────────────────────

interface ApiError {
  error: string;
}

async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    apiKey: string;
  }
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "x-api-key": options.apiKey,
    "User-Agent": `extractvibe-cli/${VERSION}`,
  };

  const fetchOptions: RequestInit = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    throw new Error(`Network error: ${message}`);
  }

  if (!response.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // Could not parse error response
    }

    const errorMessage = errorBody?.error || `HTTP ${response.status}`;

    switch (response.status) {
      case 401:
        throw new Error(
          `Authentication failed: ${errorMessage}\n\n  Make sure your API key is valid.\n  Get one at ${cyan("https://extractvibe.com/dashboard")}`
        );
      case 402:
        throw new Error(
          `No credits remaining.\n\n  Top up at ${cyan("https://extractvibe.com/pricing")}`
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

  return response.json() as Promise<T>;
}

async function apiRequestRaw(
  path: string,
  apiKey: string
): Promise<string> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "User-Agent": `extractvibe-cli/${VERSION}`,
  };

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    throw new Error(`Network error: ${message}`);
  }

  if (!response.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // Could not parse error response
    }
    const errorMessage = errorBody?.error || `HTTP ${response.status}`;
    throw new Error(`Export failed (${response.status}): ${errorMessage}`);
  }

  return response.text();
}

// ─── Polling ─────────────────────────────────────────────────────────────────

/** Step labels shown to the user. Maps backend step IDs to friendly labels. */
const STEP_LABELS: Record<string, string> = {
  "fetch-render": "Fetching & rendering",
  "fetch": "Fetching & rendering",
  "parse-assets": "Parsing visual identity",
  "visual": "Parsing visual identity",
  "analyze-voice": "Analyzing brand voice",
  "voice": "Analyzing brand voice",
  "synthesize-vibe": "Synthesizing vibe",
  "vibe": "Synthesizing vibe",
  "score-package": "Packaging results",
  "package": "Packaging results",
};

/** The five pipeline steps in order. */
const PIPELINE_STEPS = [
  "fetch",
  "visual",
  "voice",
  "vibe",
  "package",
] as const;

interface PollJobResult {
  success: boolean;
  jobId: string;
}

async function pollJobToCompletion(
  jobId: string,
  apiKey: string
): Promise<PollJobResult> {
  const completedSteps = new Set<string>();
  let currentSpinner: Spinner | null = null;
  let currentStep: string | null = null;
  const startTime = Date.now();

  // Start with the first step spinner
  const firstLabel = STEP_LABELS[PIPELINE_STEPS[0]] || "Starting extraction";
  currentSpinner = new Spinner(firstLabel);
  currentStep = PIPELINE_STEPS[0];
  currentSpinner.start();

  while (true) {
    // Check timeout
    if (Date.now() - startTime > POLL_TIMEOUT_MS) {
      if (currentSpinner) currentSpinner.fail("Timed out");
      throw new Error(
        "Extraction timed out after 2 minutes. The job may still be processing — check your dashboard."
      );
    }

    // Wait before polling
    await sleep(POLL_INTERVAL_MS);

    let statusResponse: any;
    try {
      statusResponse = await apiRequest<any>(`/extract/${jobId}`, { apiKey });
    } catch (err) {
      // Transient poll errors are non-fatal — keep trying
      continue;
    }

    const status = statusResponse?.status;

    // The workflow status from Cloudflare Workflows can be:
    // { status: "running" | "complete" | "errored", output?: ... }
    if (status === "complete" || status?.status === "complete") {
      // Mark remaining steps as done
      for (const step of PIPELINE_STEPS) {
        if (!completedSteps.has(step)) {
          if (currentSpinner && currentStep === step) {
            currentSpinner.succeed();
          } else if (!completedSteps.has(step)) {
            // Show skipped steps as completed
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
      const errorMsg =
        status?.error || status?.output?.error || "Unknown extraction error";
      throw new Error(`Extraction failed: ${errorMsg}`);
    }

    // For running status, try to advance our step display.
    // The workflow might expose output from completed steps, or we can
    // infer progress from the status shape.
    // Since the API returns the workflow status object, we look for
    // progress indicators in the response.
    if (status === "running" || status?.status === "running") {
      // Check if the status includes step information
      const output = status?.output || statusResponse?.output;
      if (output && typeof output === "object") {
        // If the output includes step progress info, advance display
        for (const step of PIPELINE_STEPS) {
          if (completedSteps.has(step)) continue;

          // Check if this step appears to be done based on the output
          const stepDone =
            output[step] === "complete" ||
            output?.steps?.[step] === "complete";

          if (stepDone) {
            if (currentSpinner && currentStep === step) {
              currentSpinner.succeed();
            }
            completedSteps.add(step);

            // Start next step
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

// ─── Brand Kit Summary ───────────────────────────────────────────────────────

interface BrandKitSummary {
  brandName: string | null;
  colorCount: number;
  primaryColor: string | null;
  fontNames: string[];
  vibeSummary: string | null;
  dosCount: number;
  dontsCount: number;
}

function summarizeBrandKit(kit: any): BrandKitSummary {
  const brandName = kit?.identity?.brandName || null;

  // Count colors
  let colorCount = 0;
  const lightMode = kit?.colors?.lightMode;
  if (lightMode) {
    colorCount += Object.values(lightMode).filter(
      (c: any) => c && c.hex
    ).length;
  }
  const darkMode = kit?.colors?.darkMode;
  if (darkMode) {
    colorCount += Object.values(darkMode).filter(
      (c: any) => c && c.hex
    ).length;
  }
  const rawPalette = kit?.colors?.rawPalette;
  if (Array.isArray(rawPalette) && rawPalette.length > colorCount) {
    colorCount = rawPalette.length;
  }

  // Primary color
  const primaryColor = lightMode?.primary?.hex || null;

  // Font names
  const fontNames: string[] = (kit?.typography?.families || [])
    .map((f: any) => f.name)
    .filter(Boolean);

  // Vibe
  const vibeSummary = kit?.vibe?.summary || null;

  // Rules
  const dosCount = kit?.rules?.dos?.length || 0;
  const dontsCount = kit?.rules?.donts?.length || 0;

  return {
    brandName,
    colorCount,
    primaryColor,
    fontNames,
    vibeSummary,
    dosCount,
    dontsCount,
  };
}

function printSummary(summary: BrandKitSummary): void {
  console.log("");

  if (summary.brandName) {
    console.log(`  ${bold("Brand:")} ${summary.brandName}`);
  }
  if (summary.colorCount > 0) {
    const primaryNote = summary.primaryColor
      ? ` ${dim(`(primary: ${summary.primaryColor})`)}`
      : "";
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
    // Truncate long vibe summaries for terminal display
    const maxLen = 60;
    const truncated =
      summary.vibeSummary.length > maxLen
        ? summary.vibeSummary.substring(0, maxLen - 3) + "..."
        : summary.vibeSummary;
    console.log(`  ${bold("Vibe:")} ${dim('"')}${truncated}${dim('"')}`);
  }
  if (summary.dosCount > 0 || summary.dontsCount > 0) {
    console.log(
      `  ${bold("Rules:")} ${summary.dosCount} DOs, ${summary.dontsCount} DON'Ts`
    );
  }
}

// ─── File Writing ────────────────────────────────────────────────────────────

async function writeFile(filePath: string, content: string): Promise<void> {
  const { writeFile: fsWrite } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const resolved = resolve(filePath);
  await fsWrite(resolved, content, "utf-8");
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // --help
  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // --version
  if (args.version) {
    printVersion();
    process.exit(0);
  }

  // Require URL
  if (!args.url) {
    printHelp();
    process.exit(1);
  }

  // Resolve API key
  const apiKey = args.apiKey || process.env.EXTRACTVIBE_API_KEY || null;
  if (!apiKey) {
    fatal(
      `API key required.\n\n  Pass ${bold("--api-key <key>")} or set the ${bold("EXTRACTVIBE_API_KEY")} environment variable.\n\n  Get a free API key at ${cyan("https://extractvibe.com/dashboard")}`
    );
  }

  // Validate and normalize URL
  const url = normalizeUrl(args.url);
  const domain = getDomainFromUrl(url);

  // Print header
  console.log("");
  console.log(
    `  ${bold("extractvibe")} ${dim(`v${VERSION}`)}`
  );
  console.log("");
  console.log(`  ${bold("Extracting:")} ${cyan(domain)}`);

  const totalStart = Date.now();

  // ── Step 1: Start extraction ────────────────────────────────────────────
  let jobId: string;
  try {
    const response = await apiRequest<{ jobId: string; domain: string }>(
      "/extract",
      {
        method: "POST",
        body: { url },
        apiKey,
      }
    );
    jobId = response.jobId;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to start extraction";
    fatal(message);
  }

  // ── Step 2: Poll until complete ─────────────────────────────────────────
  try {
    await pollJobToCompletion(jobId, apiKey);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Extraction failed";
    fatal(message);
  }

  const totalElapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
  console.log("");
  console.log(`  ${green("\u2713")} ${bold("Done")} ${dim(`in ${totalElapsed}s`)}`);

  // ── Step 3: Fetch result ────────────────────────────────────────────────
  let resultContent: string;
  let brandKit: any = null;

  try {
    if (args.format === "json") {
      // Fetch the full brand kit JSON for both the output and the summary
      brandKit = await apiRequest<any>(`/extract/${jobId}/result`, { apiKey });
      resultContent = JSON.stringify(brandKit, null, 2);
    } else {
      // Fetch the formatted export
      resultContent = await apiRequestRaw(
        `/extract/${jobId}/export/${args.format}`,
        apiKey
      );

      // Also fetch JSON for the summary (best-effort)
      try {
        brandKit = await apiRequest<any>(`/extract/${jobId}/result`, {
          apiKey,
        });
      } catch {
        // Non-fatal — just skip the summary
      }
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch results";
    fatal(message);
  }

  // ── Step 4: Show summary ────────────────────────────────────────────────
  if (brandKit) {
    const summary = summarizeBrandKit(brandKit);
    printSummary(summary);
  }

  // ── Step 5: Write output ────────────────────────────────────────────────
  const outputPath =
    args.output || getDefaultFilename(domain, args.format);

  try {
    await writeFile(outputPath, resultContent);
    console.log("");
    console.log(`  Saved to ${cyan(outputPath)}`);
    console.log("");
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to write file";
    fatal(`Could not write to ${outputPath}: ${message}`);
  }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  fatal(`Unexpected error: ${message}`);
});
