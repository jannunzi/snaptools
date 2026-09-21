# FactsTools

Free one-off online tools — practice sheets, templates, quick reference. Trivial and specific beats clever and broad. No accounts. Most tools run entirely in the browser; History Timeline optionally caches generated events in MongoDB so Grok is not asked twice for the same span.

- [Multiplication Tables Practice](/tools/multiplication-tables) — pick tables 1–12, then Practice, a 60-second quiz, or Streak mode. Instant feedback, missed/slow-fact review, printable chart.
- [Music Note Recognition](/tools/music-note-recognition) — name the note on a treble staff. Lines-only or lines + spaces, optional ledger lines, Practice or Streak.
- [Spelling Practice](/tools/spelling-practice) — Clear voice speaks a word (US/UK English accent, browser fallback); type the spelling in English, Spanish, or French. Set size 10/20/40/all from a larger bank. Spanish accents optional.
- [Printable Coloring Pages](/tools/printable-coloring) — 12 starter-pack pages plus optional this-visit-only Imagine pages. Color on screen, then print or download a PNG.
- [USCIS Civics Quiz](/tools/civics-quiz) — official 2025 128-question bank. Quick 10, interview 20 (pass 12+), or browse.
- [Division Facts Practice](/tools/division-facts) — pick divisors 1–12, then Practice, a 60-second quiz, or Streak mode. Exact facts only, missed/slow-fact review, printable chart.
- [Telling Time Practice](/tools/telling-time) — read an analog clock and type the digital time. Whole hours through to the minute; Practice, 60-second quiz, or Streak. Instant feedback and missed-time review.
- [Counting Money Practice](/tools/counting-money) — count US coins and bills, or make change. Easy coin ID through mixed coins, $1/$5 bills, and make-change; Practice, 60-second quiz, or Streak. Instant feedback and missed-item review.
- [Addition & Subtraction Facts Practice](/tools/addition-subtraction-facts) — addition, subtraction, or mixed facts through 20. Easy / Medium / Challenge presets, then Practice, a 60-second quiz, or Streak. Instant feedback, missed/slow-fact review, printable addition chart.
- [History Timeline](/tools/history-timeline) — horizontal world history (past left, future right) with parallel lanes. Swap a lane’s category or add your own, zoom millennia to days, and fill missing spans with Grok. Zoom and scroll restore on reload. Seeded events show on first paint; MongoDB caches category + time window + granularity.
- [US States & Capitals](/tools/states-and-capitals) — name the capital or the state. Multiple choice or type-the-answer, Census regions, Quick 10 / Full 50 / Streak, optional postal hint, missed-pair review.
- [Fractions Practice](/tools/fractions-practice) — identify a shaded pie or bar, simplify, name equivalents, compare, add/subtract like denominators, and convert improper ↔ mixed. Practice, 60-second quiz, or Streak. Instant feedback and missed-item review.
- [Place Value Practice](/tools/place-value) — name the place of an underlined digit or its value. Ones through hundred thousands, expanded form, compare, decimals to thousandths, and rounding. Practice, 60-second quiz, or Streak. Instant feedback, missed-item review, printable chart.
- [Skip Counting Practice](/tools/skip-counting) — fill the missing number in a short sequence by 2s, 5s, 10s, and beyond. Easy / Medium / Challenge, then Practice, a 60-second quiz, or Streak. Instant feedback, missed-item review, printable 2s/5s/10s chart.
- [First Communion Prayers](/tools/first-communion-prayers) — Our Father, Hail Mary, Glory Be, and a child-friendly Act of Contrition. Put lines in order or fill a missing word. Practice, short quiz, or Streak.
- [Parts of the Mass](/tools/parts-of-the-mass) — name the four parts of Mass and match Gospel, Homily, Consecration, Sign of Peace, Communion, and Dismissal.
- [Eucharist Basics](/tools/eucharist-basics) — First Communion quiz: Body and Blood of Christ, bread and wine, reverence, Baptism and a ready heart, the Communion fast in simple words.
- [Roman Numerals Practice](/tools/roman-numerals) — read and write Roman numerals from I to MMMCMXCIX. Easy (1–20), Medium (1–100), or Challenge (1–3999); Arabic ↔ Roman; Practice, 60-second quiz, or Streak. Instant feedback, missed-item review, printable chart.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS
- Client tools plus small server routes for xAI (TTS, Imagine, History Timeline chat)
- Optional MongoDB Atlas cache for History Timeline windows
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
| `XAI_API_KEY` | (none) | Server-only xAI key for Grok TTS, Imagine, and History Timeline fills. Never prefix with `NEXT_PUBLIC_`. |
| `MONGODB_URI` | (none) | MongoDB Atlas URI for History Timeline event cache. `MONGO_URI` is accepted as a fallback. Without it, seed events still render and Grok fills are not persisted. |
| `MONGODB_DB` | `snaptools` | Database name. Defaults to `snaptools`. Never writes to the course `web-dev` database, even if that name is in the URI path. |

Book links are always:

```
https://www.amazon.com/dp/{ASIN}?tag={TAG}
```

The affiliate disclosure (“As an Amazon Associate we earn from qualifying purchases.”) is rendered on the banner and in the footer.

## How to add a tool

1. **Register it** in `lib/tools.ts`  
   Add a new entry with `status: "live"`, `category` (`math` | `history-civics` | `languages` | `arts` | `faith`), `title`, `tagline`, `description`, `audience`, `howTo`, `day`, `publishedOn`, and 2–3 related Amazon books with real ASINs. The homepage groups live tools by that category.

2. **Build the tool** as a client component  
   Add `components/tools/YourTool.tsx`. Keep it account-free: no auth. Server routes are OK when a secret must stay off the client (see `/api/tts`, `/api/coloring/generate`, and `/api/history-timeline/events`).

3. **Map the slug** in `lib/tool-components.tsx`

   ```tsx
   case "your-tool-slug":
     return <YourTool />;
   ```

4. The route `/tools/[slug]` already wraps every tool in `ToolShell` (header, how-to tip, `AmazonBookBanner`). Homepage cards come from the same registry.

That’s it. Do not add accounts or a CMS just to ship a tool. History Timeline is the exception that uses MongoDB as a cache, not as a CMS.

## Site map

| Route | What |
| --- | --- |
| `/` | Hero, featured card, tools grouped by category |
| `/tools/multiplication-tables` | Live multiplication practice |
| `/tools/music-note-recognition` | Live treble-staff quiz |
| `/tools/spelling-practice` | Live EN/ES/FR spelling by ear |
| `/tools/printable-coloring` | Live original coloring pages |
| `/tools/civics-quiz` | Live USCIS 2025 civics practice |
| `/tools/division-facts` | Live division facts practice |
| `/tools/telling-time` | Live analog clock practice |
| `/tools/counting-money` | Live US money counting and make-change |
| `/tools/addition-subtraction-facts` | Live addition and subtraction facts practice |
| `/tools/history-timeline` | Live multi-lane history timeline |
| `/tools/states-and-capitals` | Live 50-state capitals quiz |
| `/tools/fractions-practice` | Live fraction fluency practice |
| `/tools/place-value` | Live place-value, expanded form, and rounding practice |
| `/tools/skip-counting` | Live skip-counting sequences by 2s, 5s, 10s, and beyond |
| `/tools/first-communion-prayers` | Live First Communion prayer practice |
| `/tools/parts-of-the-mass` | Live Parts of the Mass quiz |
| `/tools/eucharist-basics` | Live Eucharist basics quiz |
| `/tools/roman-numerals` | Live Roman numeral conversion practice |
| `/api/history-timeline/events` | Cached + generated timeline events |
| `/sitemap.xml` | Generated from the registry |
| `/robots.txt` | Allows crawlers; points at the sitemap |

Shared UI: `SiteHeader`, `SiteFooter`, `ToolShell`, `AmazonBookBanner`, `ToolCard`.

## Deploy on Vercel

1. Import the GitHub repo in Vercel (Next.js is detected automatically).
2. Set `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` and `NEXT_PUBLIC_SITE_URL` for Production and Preview.
3. Set **`XAI_API_KEY`** (sensitive) for Production, Preview, and Development so spelling can use Grok TTS, coloring can generate Imagine pages, and History Timeline can fill missing spans. Get a key at [console.x.ai](https://console.x.ai/). The key stays on the server — never add `NEXT_PUBLIC_`.
4. Set **`MONGODB_URI`** (sensitive) so History Timeline can persist generated windows. `MONGO_URI` is also read if `MONGODB_URI` is unset. The cache uses database **`snaptools`** (override with `MONGODB_DB` if needed). It will not write to the course `web-dev` database. Indexes are created on first successful connection; or run `npm run history:indexes` once against Atlas.
5. Deploy. Other tools do not need a database.

To refresh the checked-in coloring starter pack locally:

```bash
# after adding XAI_API_KEY to .env.local
npm run generate:coloring
```

Without a key, spelling falls back to the browser voice, coloring still uses the static pages in `public/coloring/`, and History Timeline still shows seeded events (AI fills stay empty until `XAI_API_KEY` is set).

### History Timeline cache

Events are stored in `snaptools.history_event_windows` (or `MONGODB_DB` if you set a different FactsTools database), keyed by **category + granularity + aligned window start**. Zooming in (including months, weeks, and days) requests finer windows; those fills add detail without repeating a coarse query. Custom lane names travel with the request so Grok can fill user-defined categories. Zoom, scroll position, and personal categories are stored in the browser (`localStorage`). The course `web-dev` database is never used.

```bash
# after adding MONGODB_URI to .env.local
npm run history:indexes
```

```bash
npm run build
```

must pass before you merge.

## Product rules

- One job per tool. Multiplication practice is not a math classroom.
- Works on a phone first. Big tap targets, no hover-only UI.
- Dark mode follows the system color scheme.
- Affiliate books sit **below** the tool, never in the way of using it.
