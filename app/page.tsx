import Link from "next/link";
import { ToolCard } from "@/components/ToolCard";
import { siteDescription, siteTagline } from "@/lib/site";
import {
  getFeaturedTool,
  getLiveTools,
  groupToolsByCategory,
} from "@/lib/tools";

export default function Home() {
  const featured = getFeaturedTool();
  const categories = groupToolsByCategory(getLiveTools());

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
      <section className="max-w-3xl">
        <h1 className="font-display text-[2.5rem] leading-[1.08] text-ink sm:text-6xl">
          {siteTagline}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted sm:text-xl">
          {siteDescription}
        </p>
        <Link href={`/tools/${featured.slug}`} className="snap-btn mt-8">
          Open featured tool
        </Link>
      </section>

      <section className="mt-16" aria-labelledby="featured-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2
            id="featured-heading"
            className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
          >
            Featured
          </h2>
          <Link
            href={`/tools/${featured.slug}`}
            className="snap-link text-sm"
          >
            Open
          </Link>
        </div>
        <ToolCard tool={featured} featured />
      </section>

      {categories.map((group) => (
        <section
          key={group.id}
          className="mt-16"
          aria-labelledby={`category-${group.id}-heading`}
        >
          <h2
            id={`category-${group.id}-heading`}
            className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
          >
            {group.label}
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
