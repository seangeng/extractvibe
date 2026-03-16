# ExtractVibe MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that gives AI assistants the ability to extract and query brand kits from any website using the [ExtractVibe](https://extractvibe.com) API.

## Installation

```bash
npm install -g extractvibe-mcp
```

Or install locally in a project:

```bash
npm install extractvibe-mcp
```

## Configuration

### Claude Code / Claude Desktop

Add to your `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "extractvibe": {
      "command": "extractvibe-mcp",
      "env": {
        "EXTRACTVIBE_API_KEY": "ev_your_key_here"
      }
    }
  }
}
```

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "extractvibe": {
      "command": "extractvibe-mcp",
      "env": {
        "EXTRACTVIBE_API_KEY": "ev_your_key_here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXTRACTVIBE_API_KEY` | Yes | Your ExtractVibe API key (starts with `ev_`) |
| `EXTRACTVIBE_BASE_URL` | No | Override the API base URL (default: `https://extractvibe.com`) |

Get your API key at [extractvibe.com/dashboard](https://extractvibe.com/dashboard).

## Available Tools

### `extract_brand`

Extract a comprehensive brand kit from a website URL. Returns colors, typography, voice analysis, brand rules, and vibe synthesis. Costs 1 credit per extraction.

**Input:** `{ url: "https://stripe.com" }`

### `get_brand_colors`

Get the color palette for a previously extracted brand. Returns light mode, dark mode, semantic colors, and raw palette.

**Input:** `{ domain: "stripe.com" }`

### `get_brand_typography`

Get the typography system including font families, type scale, and conventions.

**Input:** `{ domain: "stripe.com" }`

### `get_brand_voice`

Get the brand voice analysis: tone spectrum, copywriting style, and content patterns.

**Input:** `{ domain: "stripe.com" }`

### `get_brand_rules`

Get AI-inferred brand DOs and DON'Ts for visual and verbal usage, with vibe context.

**Input:** `{ domain: "stripe.com" }`

### `get_brand_vibe`

Get the holistic brand vibe: summary, tags, visual energy, comparable brands, and personality archetypes.

**Input:** `{ domain: "stripe.com" }`

### `export_brand`

Export a brand kit in a developer-friendly format.

**Input:** `{ domain: "stripe.com", format: "css" }`

Supported formats:
- `css` — CSS custom properties (`:root { --ev-color-primary: ... }`)
- `tailwind` — Tailwind CSS v4 `@theme` block
- `markdown` — Full brand report in Markdown
- `tokens` — W3C Design Tokens JSON

## Example Usage in Claude

> "Extract the brand kit for stripe.com"

Claude calls `extract_brand` with `{ url: "https://stripe.com" }`, waits for the extraction to complete, and returns a formatted brand report with colors, typography, voice, rules, and vibe.

> "What colors does Linear use?"

Claude calls `get_brand_colors` with `{ domain: "linear.app" }` and returns the color palette.

> "Export Notion's brand as Tailwind theme variables"

Claude calls `export_brand` with `{ domain: "notion.so", format: "tailwind" }` and returns a ready-to-use `@theme` block.

> "I'm building a landing page for a client. Extract their brand from acme.com and give me the CSS variables."

Claude first calls `extract_brand`, then `export_brand` with `format: "css"`.

## Development

```bash
cd mcp/
npm install
npm run build
```

The build produces `dist/index.js` which is the executable MCP server.

To test locally without installing globally:

```bash
node dist/index.js
```

## License

MIT
