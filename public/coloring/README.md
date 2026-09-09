# Coloring starter pack

Twelve portrait pages served from this folder so the tool stays fast (no Imagine call per pageview).

| File | Status |
| --- | --- |
| `*.png` | Grok Imagine (`grok-imagine-image-2.0`) black-and-white coloring outlines |
| `generated.json` | Stamp written by the generate script (`temporary: false` when live) |

Prompts live in `lib/coloring-pages.ts` and `scripts/generate-coloring.mjs`. Re-run with `XAI_API_KEY` via `npm run generate:coloring`. The optional **Generate new page** button calls `/api/coloring/generate` (lightly rate-limited).
