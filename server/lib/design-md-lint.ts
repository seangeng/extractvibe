/**
 * DESIGN.md Linter — pure TS port of the rules from
 * https://github.com/google-labs-code/design.md.
 *
 * Runs inline in the Worker (no node spawn). Validates:
 *   - canonical section order (errors on out-of-order or duplicate sections)
 *   - frontmatter color values are valid hex
 *   - frontmatter token references {path.to.token} resolve
 *   - a `primary` color is present
 *   - WCAG AA contrast for primary on surface (warning, not error)
 */

export interface LintFinding {
  severity: "error" | "warning";
  rule: string;
  message: string;
  line?: number;
}

export interface LintResult {
  ok: boolean;
  findings: LintFinding[];
  errors: LintFinding[];
  warnings: LintFinding[];
}

// ─── Canonical sections (in required order, per spec) ────────────────

const CANONICAL_SECTIONS = [
  "Overview",
  "Brand & Style",
  "Colors",
  "Typography",
  "Layout",
  "Layout & Spacing",
  "Elevation & Depth",
  "Elevation",
  "Shapes",
  "Components",
  "Do's and Don'ts",
] as const;

// Every canonical heading maps to a "slot index" — duplicates within a slot
// are an error, ordering violations are an error.
const SECTION_SLOT: Record<string, number> = {
  "overview": 0,
  "brand & style": 0,
  "colors": 1,
  "typography": 2,
  "layout": 3,
  "layout & spacing": 3,
  "elevation & depth": 4,
  "elevation": 4,
  "shapes": 5,
  "components": 6,
  "do's and don'ts": 7,
};

// ─── Tiny YAML parser (frontmatter only, no anchors / refs) ──────────
// We intentionally do not pull a YAML lib — Workers compile size matters.
// This handles the subset DESIGN.md actually uses: scalars, nested maps,
// flow maps `{ k: v, k: v }`, hex strings.

interface ParsedFrontmatter {
  raw: string;
  data: Record<string, unknown>;
}

function parseFrontmatter(content: string): ParsedFrontmatter | null {
  // Strip any leading HTML comments + whitespace before scanning for the
  // `---` opener. The Google spec allows arbitrary leading HTML comments
  // (provenance headers etc.) — frontmatter is the first non-comment block.
  const stripped = content.replace(/^(?:\s*<!--[\s\S]*?-->\s*)+/, "");
  const m = stripped.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;

  const raw = m[1];
  const data: Record<string, unknown> = {};
  const stack: Array<{ obj: Record<string, unknown>; indent: number }> = [
    { obj: data, indent: -1 },
  ];

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.match(/^(\s*)/)![1].length;
    const stripped = line.slice(indent);
    const colonIdx = stripped.indexOf(":");
    if (colonIdx === -1) continue;

    const key = stripped.slice(0, colonIdx).trim();
    const rest = stripped.slice(colonIdx + 1).trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const top = stack[stack.length - 1].obj;

    if (rest === "" || rest === "{}") {
      const child: Record<string, unknown> = {};
      top[key] = child;
      stack.push({ obj: child, indent });
    } else if (rest.startsWith("{") && rest.endsWith("}")) {
      // Flow map: { fontSize: 14px, fontWeight: 500 }
      const inner = rest.slice(1, -1);
      const child: Record<string, unknown> = {};
      const pairs = splitFlowMap(inner);
      for (const p of pairs) {
        const ci = p.indexOf(":");
        if (ci === -1) continue;
        const k2 = p.slice(0, ci).trim();
        const v2 = unquote(p.slice(ci + 1).trim());
        child[k2] = v2;
      }
      top[key] = child;
    } else {
      top[key] = unquote(rest);
    }
  }

  return { raw, data };
}

function splitFlowMap(s: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of s) {
    if (ch === "{" || ch === "[") depth++;
    if (ch === "}" || ch === "]") depth--;
    if (ch === "," && depth === 0) {
      if (buf.trim()) parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

function unquote(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const TOKEN_REF_RE = /\{([a-zA-Z0-9_.\-]+)\}/g;

function hexToRgb(hex: string): [number, number, number] | null {
  if (!HEX_RE.test(hex)) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(hexA: string, hexB: string): number | null {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return null;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function resolveTokenRef(
  path: string,
  data: Record<string, unknown>
): unknown | undefined {
  const parts = path.split(".");
  let cur: unknown = data;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

// ─── Main lint entry point ───────────────────────────────────────────

export function lintDesignMd(content: string): LintResult {
  const findings: LintFinding[] = [];

  // ── 1. Frontmatter parse ──
  const fm = parseFrontmatter(content);
  if (!fm) {
    findings.push({
      severity: "warning",
      rule: "frontmatter-missing",
      message: "No YAML frontmatter found. Tools that consume tokens (lint --export, Tailwind theme generation) will not have anything to read.",
    });
  }

  // ── 2. Required `name` ──
  if (fm && (!fm.data.name || typeof fm.data.name !== "string")) {
    findings.push({
      severity: "error",
      rule: "name-required",
      message: "Frontmatter must include a `name` field.",
    });
  }

  // ── 3. Section order + duplicates ──
  const headingRe = /^##\s+(.+?)\s*$/gm;
  const seenSlots = new Set<number>();
  let lastSlot = -1;
  let m: RegExpExecArray | null;
  while ((m = headingRe.exec(content)) !== null) {
    const heading = m[1].trim();
    const slot = SECTION_SLOT[heading.toLowerCase()];
    if (slot === undefined) continue; // unknown sections preserved without error per spec

    if (seenSlots.has(slot)) {
      findings.push({
        severity: "error",
        rule: "duplicate-section",
        message: `Duplicate canonical section heading: "## ${heading}". The spec rejects files with two headings in the same slot.`,
        line: lineOf(content, m.index),
      });
    }
    seenSlots.add(slot);

    if (slot < lastSlot) {
      findings.push({
        severity: "error",
        rule: "section-order",
        message: `Section "## ${heading}" appears out of canonical order. Expected order: ${CANONICAL_SECTIONS.join(" → ")}.`,
        line: lineOf(content, m.index),
      });
    }
    lastSlot = slot;
  }

  // ── 4. Color values must be valid hex ──
  if (fm) {
    const colors = fm.data.colors as Record<string, unknown> | undefined;
    if (colors && typeof colors === "object") {
      for (const [name, raw] of Object.entries(colors)) {
        if (typeof raw !== "string") continue;
        // Token refs are resolved later, not validated as hex
        if (raw.startsWith("{") && raw.endsWith("}")) continue;
        if (!HEX_RE.test(raw)) {
          findings.push({
            severity: "error",
            rule: "invalid-color",
            message: `colors.${name} = "${raw}" is not a valid hex (#rgb, #rrggbb, or #rrggbbaa).`,
          });
        }
      }
    } else if (colors === undefined) {
      findings.push({
        severity: "warning",
        rule: "no-colors",
        message: "No `colors:` map in frontmatter — agents have no token bindings to use.",
      });
    }
  }

  // ── 5. `primary` color present ──
  if (fm) {
    const colors = fm.data.colors as Record<string, unknown> | undefined;
    if (colors && typeof colors === "object" && !("primary" in colors)) {
      findings.push({
        severity: "warning",
        rule: "no-primary",
        message: "No `primary` color defined. The Google spec recommends `primary` as the canonical CTA color name.",
      });
    }
  }

  // ── 6. Token references resolve ──
  if (fm) {
    let tm: RegExpExecArray | null;
    const seenRefs = new Set<string>();
    while ((tm = TOKEN_REF_RE.exec(fm.raw)) !== null) {
      const ref = tm[1];
      if (seenRefs.has(ref)) continue;
      seenRefs.add(ref);
      if (resolveTokenRef(ref, fm.data) === undefined) {
        findings.push({
          severity: "error",
          rule: "broken-token-ref",
          message: `Unresolved token reference: {${ref}}. No matching key in frontmatter.`,
        });
      }
    }
  }

  // ── 7. WCAG AA contrast (primary on surface) ──
  if (fm) {
    const colors = fm.data.colors as Record<string, unknown> | undefined;
    const primary = colors?.["primary"];
    const surface = colors?.["surface"] ?? colors?.["background"];
    if (typeof primary === "string" && typeof surface === "string" && HEX_RE.test(primary) && HEX_RE.test(surface)) {
      const ratio = contrastRatio(primary, surface);
      if (ratio !== null && ratio < 4.5) {
        findings.push({
          severity: "warning",
          rule: "low-contrast",
          message: `primary (${primary}) on surface (${surface}) has contrast ratio ${ratio.toFixed(2)}:1, below WCAG AA (4.5:1) for body text.`,
        });
      }
    }
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");

  return { ok: errors.length === 0, findings, errors, warnings };
}

function lineOf(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}
