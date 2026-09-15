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

  return (
    <Link
      href={href}
      className={`snap-panel block transition-colors ${
        featured ? "sm:p-8" : ""
      } ${isLive ? "hover:border-ink/30" : "opacity-80"}`}
    >
      <div className="flex items-center justify-between gap-3">
        {showNew ? (
          <span className="snap-badge snap-badge-new">New</span>
        ) : (
          <span />
        )}
        <span
          className={`snap-badge ${isLive ? "snap-badge-live" : "snap-badge-muted"}`}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>
      <h3
        className={`mt-5 font-display leading-tight text-ink ${
          featured ? "text-[1.75rem] sm:text-3xl" : "text-xl sm:text-2xl"
        }`}
      >
        {tool.title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">
        {tool.tagline}
      </p>
      <p className="mt-3 text-sm text-ink-muted">{tool.audience}</p>
      <span
        className={`mt-6 inline-flex text-sm font-medium ${
          isLive ? "text-secondary" : "text-ink-muted"
        }`}
      >
        {isLive ? "Open tool" : "Coming soon"}
      </span>
    </Link>
  );
}
