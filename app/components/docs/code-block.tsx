import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
  title?: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJSON(code: string): string {
  // Process JSON line by line for clean highlighting
  return code.split("\n").map(line => {
    const escaped = escapeHtml(line);
    // Key: value pattern
    return escaped
      // Keys (before colon)
      .replace(/^(\s*)(&quot;|")([\w\-]+)(&quot;|")(:)/gm, '$1<span class="text-sky-400">"$3"</span>$5')
      // String values (after colon)
      .replace(/(:\s*)(&quot;|")(.*?)(&quot;|")/g, '$1<span class="text-emerald-400">"$3"</span>')
      // Numbers
      .replace(/(:\s*)(\d+(?:\.\d+)?)/g, '$1<span class="text-amber-400">$2</span>')
      // Booleans and null
      .replace(/\b(true|false|null)\b/g, '<span class="text-violet-400">$1</span>');
  }).join("\n");
}

function highlightBash(code: string): string {
  return code.split("\n").map(line => {
    let html = escapeHtml(line);
    // Comments
    html = html.replace(/^(\s*#.*)$/g, '<span class="text-neutral-500">$1</span>');
    if (html.includes("text-neutral-500")) return html;
    // Strings
    html = html.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-emerald-400">$&</span>');
    // Flags
    html = html.replace(/(\s)(-\w+)/g, '$1<span class="text-sky-400">$2</span>');
    // Commands
    html = html.replace(/^(\s*)(curl|npx|echo|JOB|sleep)\b/g, '$1<span class="text-violet-400">$2</span>');
    // URLs
    html = html.replace(/(https?:\/\/[^\s"'\\]+)/g, '<span class="text-amber-300">$1</span>');
    return html;
  }).join("\n");
}

function highlightJS(code: string): string {
  return code.split("\n").map(line => {
    let html = escapeHtml(line);
    // Comments
    html = html.replace(/^(\s*\/\/.*)$/g, '<span class="text-neutral-500">$1</span>');
    if (html.includes("text-neutral-500")) return html;
    // Strings
    html = html.replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-emerald-400">$&</span>');
    // Keywords
    html = html.replace(/\b(const|let|var|await|async|function|return|import|from|export|if|else|try|catch|new|throw|typeof)\b/g, '<span class="text-violet-400">$1</span>');
    // Numbers (not inside tags)
    html = html.replace(/(?<!["\w-])(\d+(?:\.\d+)?)(?!["\w])/g, '<span class="text-amber-400">$1</span>');
    return html;
  }).join("\n");
}

function highlightPython(code: string): string {
  return code.split("\n").map(line => {
    let html = escapeHtml(line);
    // Comments
    html = html.replace(/^(\s*#.*)$/g, '<span class="text-neutral-500">$1</span>');
    if (html.includes("text-neutral-500")) return html;
    // Strings
    html = html.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-emerald-400">$&</span>');
    // Keywords
    html = html.replace(/\b(import|from|def|return|if|else|try|except|as|with|print|for|in|class|True|False|None|response|requests)\b/g, '<span class="text-violet-400">$1</span>');
    // Numbers
    html = html.replace(/(?<!["\w-])(\d+(?:\.\d+)?)(?!["\w])/g, '<span class="text-amber-400">$1</span>');
    return html;
  }).join("\n");
}

function highlightCode(code: string, language: string): string {
  switch (language) {
    case "json": return highlightJSON(code);
    case "bash": return highlightBash(code);
    case "python": return highlightPython(code);
    case "javascript": return highlightJS(code);
    default: return escapeHtml(code);
  }
}

export function CodeBlock({ code, language, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
        <span className="font-mono text-xs text-neutral-500">
          {title || language}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code
          className="font-mono text-neutral-300"
          dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
        />
      </pre>
    </div>
  );
}
