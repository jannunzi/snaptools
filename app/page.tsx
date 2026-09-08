import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { siteDescription, siteName, siteTagline } from "@/lib/site";
import { getFeaturedTool, tools } from "@/lib/tools";

export default function Home() {
  const featured = getFeaturedTool();
  const rest = tools.filter((tool) => tool.slug !== featured.slug);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
          {siteName}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-[1.1] text-ink sm:text-6xl">
          {siteTagline}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">
          {siteDescription}
        </p>
        <Link
          href={`/tools/${featured.slug}`}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-5 text-base font-bold text-accent-ink hover:brightness-110"
        >
          Open featured tool
        </Link>
      </section>

      <section className="mt-10" aria-labelledby="featured-heading">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="featured-heading" className="font-display text-2xl text-ink">
            Featured
          </h2>
          <Link
            href={`/tools/${featured.slug}`}
            className="text-sm font-bold text-secondary-strong hover:underline"
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
    </div>
  );
}
