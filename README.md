# SnapTools

Free one-off online tools — practice sheets, templates, quick reference. Trivial and specific beats clever and broad. No accounts, no database, no analytics SDKs. Everything runs in the browser.

- [Multiplication Tables Practice](/tools/multiplication-tables) — pick tables 1–12, then Practice, a 60-second quiz, or Streak mode. Instant feedback, missed/slow-fact review, printable chart.
- [Music Note Recognition](/tools/music-note-recognition) — name the note on a treble staff. Lines-only or lines + spaces, optional ledger lines, Practice or Streak.
- [Spelling Practice](/tools/spelling-practice) — SpeechSynthesis speaks a word; type the spelling in English, Spanish, or French. Score and streak.
- [Printable Coloring Pages](/tools/printable-coloring) — original line art (animals, mandalas, generic fantasy, nature). Color on screen, then print or download.
- [USCIS Civics Quiz](/tools/civics-quiz) — official 2025 128-question bank. Quick 10, interview 20 (pass 12+), or browse.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Client-side tools only
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

Book links are always:

```
https://www.amazon.com/dp/{ASIN}?tag={TAG}
```

The affiliate disclosure (“As an Amazon Associate we earn from qualifying purchases.”) is rendered on the banner and in the footer.

## How to add tomorrow’s tool

1. **Register it** in `lib/tools.ts`  
   Add a new entry with `status: "live"`, `title`, `tagline`, `description`, `audience`, `howTo`, `day`, `publishedOn`, and 2–3 related Amazon books with real ASINs.

2. **Build the tool** as a client component  
   Add `components/tools/YourTool.tsx`. Keep it browser-only: no auth, no fetch to your own API, no analytics.

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
| `/sitemap.xml` | Generated from the registry |
| `/robots.txt` | Allows crawlers; points at the sitemap |

Shared UI: `SiteHeader`, `SiteFooter`, `ToolShell`, `AmazonBookBanner`, `ToolCard`.

## Deploy on Vercel

1. Import the GitHub repo in Vercel (Next.js is detected automatically).
2. Set `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` and `NEXT_PUBLIC_SITE_URL` for Production and Preview.
3. Deploy. No database or auth providers required.

```bash
npm run build
```

must pass before you merge.

## Product rules

- One job per tool. Multiplication practice is not a math classroom.
- Works on a phone first. Big tap targets, no hover-only UI.
- Dark mode follows the system color scheme.
- Affiliate books sit **below** the tool, never in the way of using it.
