import Link from "next/link";
import type { Tool } from "@/lib/tools";

type ToolCardProps = {
  tool: Tool;
  featured?: boolean;
};

export function ToolCard({ tool, featured = false }: ToolCardProps) {
  const href = `/tools/${tool.slug}`;
  const isLive = tool.status === "live";

  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
          Day {tool.day}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl leading-tight text-ink">
        {tool.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {tool.tagline}
      </p>
      <p className="mt-3 text-sm text-ink-muted">{tool.audience}</p>
      <span
        className={`mt-5 inline-flex text-sm font-semibold ${
          isLive ? "text-accent" : "text-ink-muted"
        }`}
      >
        {isLive ? "Open tool →" : "On the daily list"}
      </span>
    </>
  );

  const className = `snap-shadow block rounded-2xl border p-5 transition-transform sm:p-6 ${
    featured
      ? "border-accent/40 bg-surface"
      : "border-line bg-surface/90"
  } ${isLive ? "hover:-translate-y-0.5 hover:border-accent/50" : "opacity-90"}`;

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
