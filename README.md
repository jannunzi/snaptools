# SnapTools

Free one-off online tools — practice sheets, templates, quick reference. Trivial and specific beats clever and broad. No accounts, no database, no analytics SDKs. Everything runs in the browser.

**Live tools**

- [Multiplication Tables Practice](/tools/multiplication-tables) — pick tables 1–12, then Practice, a 60-second quiz, or Streak mode.
- [Music Note Recognition](/tools/music-note-recognition) — name the note on a treble staff.
- [Spelling Practice](/tools/spelling-practice) — listen and type in English, Spanish, or French.
- [Printable Coloring Pages](/tools/printable-coloring) — original line art to color on screen, print, or download.
- [US Civics Quiz](/tools/civics-quiz) — official 2025 USCIS 128-question bank, quick 10 or interview-style 20.

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

## How to add a tool

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
| `/` | Hero, featured card, tool directory |
| `/tools/multiplication-tables` | Live tool |
| `/tools/music-note-recognition` | Live tool |
| `/tools/spelling-practice` | Live tool |
| `/tools/printable-coloring` | Live tool |
| `/tools/civics-quiz` | Live tool |
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
