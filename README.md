# SnapTools

Free one-off online tools — practice sheets, templates, quick reference. Trivial and specific beats clever and broad. No accounts, no database, no analytics SDKs. Everything runs in the browser.

- [Multiplication Tables Practice](/tools/multiplication-tables) — pick tables 1–12, then Practice, a 60-second quiz, or Streak mode. Instant feedback, missed/slow-fact review, printable chart.
- [Music Note Recognition](/tools/music-note-recognition) — name the note on a treble staff. Lines-only or lines + spaces, optional ledger lines, Practice or Streak.
- [Spelling Practice](/tools/spelling-practice) — Grok TTS speaks a word (US/UK English accent, browser fallback); type the spelling in English, Spanish, or French. Set size 10/20/40/all from a larger bank. Spanish accents optional.
- [Printable Coloring Pages](/tools/printable-coloring) — 12 starter-pack pages plus optional this-visit-only Imagine pages. Color on screen, then print or download a PNG.
- [USCIS Civics Quiz](/tools/civics-quiz) — official 2025 128-question bank. Quick 10, interview 20 (pass 12+), or browse.
- [Division Facts Practice](/tools/division-facts) — pick divisors 1–12, then Practice, a 60-second quiz, or Streak mode. Exact facts only, missed/slow-fact review, printable chart.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Client tools plus small server routes for xAI (TTS + Imagine)
- Vercel-ready (`npm run build` must stay green)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` | `jannunzi04-20` | Amazon Associates tag appended to every book link |
| `NEXT_PUBLIC_SITE_URL` | `https://snaptools.vercel.app` | Canonical URL for sitemap, robots, and Open Graph |
| `XAI_API_KEY` | (none) | Server-only xAI key for Grok TTS and Imagine. Never prefix with `NEXT_PUBLIC_`. |

Book links are always:

```
https://www.amazon.com/dp/{ASIN}?tag={TAG}
```

The affiliate disclosure (“As an Amazon Associate we earn from qualifying purchases.”) is rendered on the banner and in the footer.

## How to add a tool

1. **Register it** in `lib/tools.ts`  
   Add a new entry with `status: "live"`, `title`, `tagline`, `description`, `audience`, `howTo`, `day`, `publishedOn`, and 2–3 related Amazon books with real ASINs.

2. **Build the tool** as a client component  
   Add `components/tools/YourTool.tsx`. Keep it account-free: no auth, no analytics. Server routes are OK when a secret must stay off the client (see `/api/tts` and `/api/coloring/generate`).

3. **Map the slug** in `lib/tool-components.tsx`

   ```tsx
   case "your-tool-slug":
     return <YourTool />;
   ```

4. The route `/tools/[slug]` already wraps every tool in `ToolShell` (header, how-to tip, `AmazonBookBanner`). Homepage cards come from the same registry.

That’s it. Do not add accounts, a CMS, or a database just to ship a tool.

## Site map

| Route | What |
| --- | --- |
| `/` | Hero, featured card, all-tools directory |
| `/tools/multiplication-tables` | Live multiplication practice |
| `/tools/music-note-recognition` | Live treble-staff quiz |
| `/tools/spelling-practice` | Live EN/ES/FR spelling by ear |
| `/tools/printable-coloring` | Live original coloring pages |
| `/tools/civics-quiz` | Live USCIS 2025 civics practice |
| `/tools/division-facts` | Live division facts practice |
| `/sitemap.xml` | Generated from the registry |
| `/robots.txt` | Allows crawlers; points at the sitemap |

Shared UI: `SiteHeader`, `SiteFooter`, `ToolShell`, `AmazonBookBanner`, `ToolCard`.

## Deploy on Vercel

1. Import the GitHub repo in Vercel (Next.js is detected automatically).
2. Set `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` and `NEXT_PUBLIC_SITE_URL` for Production and Preview.
3. Set **`XAI_API_KEY`** (sensitive) for Production, Preview, and Development so spelling can use Grok TTS and coloring can generate Imagine pages. Get a key at [console.x.ai](https://console.x.ai/). The key stays on the server — never add `NEXT_PUBLIC_`.
4. Deploy. No database or auth providers required.

To refresh the checked-in coloring starter pack locally:

```bash
# after adding XAI_API_KEY to .env.local
npm run generate:coloring
```

Without a key, spelling falls back to the browser voice and coloring still uses the static pages in `public/coloring/`.

```bash
npm run build
```

must pass before you merge.

## Product rules

- One job per tool. Multiplication practice is not a math classroom.
- Works on a phone first. Big tap targets, no hover-only UI.
- Dark mode follows the system color scheme.
- Affiliate books sit **below** the tool, never in the way of using it.
