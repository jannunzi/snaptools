# Coloring starter pack

Twelve portrait pages served from this folder so the tool stays fast (no Imagine call per pageview).

| File | Status |
| --- | --- |
| `*.png` | Temporary stand-in line art until `npm run generate:coloring` is run with `XAI_API_KEY` |
| `generated.json` | Stamp written by the generate script |

Prompts live in `lib/coloring-pages.ts`. The optional **Generate new page** button calls `/api/coloring/generate` (lightly rate-limited).
