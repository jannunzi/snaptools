# SnapTools

Free one-off online tools — practice sheets, templates, quick reference. Trivial and specific beats clever and broad. No accounts, no database, no analytics SDKs. Everything runs in the browser. A new tool ships every day.

**Day 1:** [Multiplication Tables Practice](/tools/multiplication-tables) — pick tables 1–12, then Practice, a 60-second quiz, or Streak mode. Instant feedback, missed/slow-fact review, printable chart.

**Day 2 (named, not built):** Music note recognition. The slug is already in `lib/tools.ts`.

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

Day 2 should be mostly data plus one page of UI.

1. **Register it** in `lib/tools.ts`  
   Copy the `music-note-recognition` entry (already there as `coming-soon`). Set `status: "live"`, fill `title`, `tagline`, `description`, `audience`, `howTo`, `day`, `publishedOn`, and 2–3 related Amazon books with real ASINs.

2. **Build the tool** as a client component  
   Add `components/tools/MusicNoteRecognition.tsx`. Keep it browser-only: no auth, no fetch to your own API, no analytics.

3. **Map the slug** in `lib/tool-components.tsx`

   ```tsx
   case "music-note-recognition":
     return <MusicNoteRecognition />;
   ```

4. The route `/tools/[slug]` already wraps every tool in `ToolShell` (header, how-to tip, `AmazonBookBanner`). Homepage cards come from the same registry.

That’s it. Do not add accounts, a CMS, or a database just to ship a daily tool.

## Site map

| Route | What |
| --- | --- |
| `/` | Hero, Day 1 featured card, tool grid, “new tool daily” note |
| `/tools/multiplication-tables` | Live Day 1 tool |
| `/tools/music-note-recognition` | Coming-soon stub for Day 2 |
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
