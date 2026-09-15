import type { ReactNode } from "react";
import { AmazonBookBanner } from "@/components/AmazonBookBanner";
import { isNewTool, type Tool } from "@/lib/tools";

type ToolShellProps = {
  tool: Tool;
  children: ReactNode;
};

export function ToolShell({ tool, children }: ToolShellProps) {
  const isLive = tool.status === "live";
  const showNew = isNewTool(tool);

  return (
    <article
      className={`mx-auto w-full px-5 py-10 sm:px-8 sm:py-14 ${
        tool.slug === "history-timeline" ? "max-w-6xl" : "max-w-5xl"
      }`}
    >
      <div className="no-print flex flex-wrap items-center gap-2">
        {showNew ? <span className="snap-badge snap-badge-new">New</span> : null}
        <span
          className={`snap-badge ${isLive ? "snap-badge-live" : "snap-badge-muted"}`}
        >
          {isLive ? "Live" : "Coming soon"}
        </span>
      </div>
      <h1 className="mt-4 font-display text-3xl leading-[1.15] text-ink sm:text-5xl">
        {tool.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
        {tool.description}
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        <span className="font-medium text-ink">Who</span>
        <span className="mx-2 text-line">·</span>
        {tool.audience}
      </p>
      <div className="no-print mt-6 rounded-2xl border border-line bg-surface px-5 py-4 text-sm leading-relaxed text-ink-muted">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">
          How to practice
        </p>
        <p className="mt-1.5">{tool.howTo}</p>
      </div>
      <div className="mt-10">{children}</div>
      <AmazonBookBanner books={tool.books} tool={tool.slug} />
    </article>
  );
}
