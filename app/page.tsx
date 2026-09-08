import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { siteDescription, siteName, siteTagline } from "@/lib/site";
import { getFeaturedTool, getNextToolDay, tools } from "@/lib/tools";

export default function Home() {
  const featured = getFeaturedTool();
  const rest = tools.filter((tool) => tool.slug !== featured.slug);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {siteName}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
          {siteTagline}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          {siteDescription}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="featured-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="featured-heading" className="font-display text-2xl text-ink">
            Day {featured.day} · Featured
          </h2>
          <Link
            href={`/tools/${featured.slug}`}
            className="text-sm font-semibold text-accent hover:underline"
          >
            Open
          </Link>
        </div>
        <ToolCard tool={featured} featured />
      </section>

      <section className="mt-10" aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="font-display text-2xl text-ink">
          All tools
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {rest.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </section>

      <section
        id="new-daily"
        className="mt-12 rounded-2xl border border-line bg-surface px-5 py-6"
      >
        <h2 className="font-display text-2xl text-ink">A new tool every day</h2>
        <p className="mt-2 max-w-2xl text-ink-muted">
          SnapTools stays small on purpose. Each day we ship one specific thing
          — a practice sheet, a generator, a quiz — that you can use in the
          browser and close. Day 2 is live. Day {getNextToolDay()} is next.
        </p>
      </section>
    </div>
  );
}
