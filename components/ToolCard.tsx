import Link from "next/link";
import { isNewTool, type Tool } from "@/lib/tools";

type ToolCardProps = {
  tool: Tool;
  featured?: boolean;
};

export function ToolCard({ tool, featured = false }: ToolCardProps) {
  const href = `/tools/${tool.slug}`;
  const isLive = tool.status === "live";

  const showNew = isNewTool(tool);

  const inner = (
    <>
      <div className="flex items-center justify-between gap-3">
        {showNew ? (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-ink">
            New
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs font-bold uppercase tracking-wide text-accent">
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
        className={`mt-5 inline-flex text-sm font-bold ${
          isLive ? "text-secondary-strong" : "text-ink-muted"
        }`}
      >
        {isLive ? "Open tool →" : "Coming soon"}
      </span>
    </>
  );

  const className = `snap-shadow block rounded-2xl border-2 p-5 transition-transform sm:p-6 ${
    featured
      ? "border-secondary bg-secondary-soft/70"
      : "border-line bg-surface"
  } ${isLive ? "hover:-translate-y-0.5 hover:border-accent" : "opacity-90"}`;

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}
