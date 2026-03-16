# extractvibe CLI

Extract brand kits from the command line.

## Install

```bash
npm install -g extractvibe
# or
npx extractvibe <url>
```

## Authentication

Get a free API key at [extractvibe.com/dashboard](https://extractvibe.com/dashboard), then pass it via flag or environment variable:

```bash
extractvibe https://stripe.com --api-key ev_abc123
# or
export EXTRACTVIBE_API_KEY=ev_abc123
extractvibe https://stripe.com
```

## Usage

```bash
# Extract a brand kit (saves JSON by default)
extractvibe https://stripe.com

# Export as Tailwind v4 theme
extractvibe https://stripe.com --format tailwind --output theme.css

# Export as CSS custom properties
extractvibe https://stripe.com --format css

# Export as a markdown brand report
extractvibe https://linear.app --format markdown

# Export as W3C design tokens
extractvibe https://vercel.com --format tokens

# Specify output file
extractvibe https://notion.so --output my-brand.json
```

## Formats

| Format     | Description                    | Extension |
|------------|--------------------------------|-----------|
| `json`     | Full brand kit (default)       | `.json`   |
| `css`      | CSS custom properties          | `.css`    |
| `tailwind` | Tailwind v4 `@theme` block    | `.css`    |
| `markdown` | Brand report document          | `.md`     |
| `tokens`   | W3C Design Tokens (JSON)       | `.json`   |

## Options

| Flag                | Description                              |
|---------------------|------------------------------------------|
| `--format, -f`      | Export format (default: `json`)           |
| `--output, -o`      | Output file path                         |
| `--api-key, --key`  | API key (or set `EXTRACTVIBE_API_KEY`)   |
| `--help, -h`        | Show help                                |
| `--version, -v`     | Show version                             |

## Requirements

- Node.js 18+ (uses built-in `fetch`)
- An ExtractVibe API key ([get one free](https://extractvibe.com/dashboard))
