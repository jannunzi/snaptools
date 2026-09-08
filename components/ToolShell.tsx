import type { ReactNode } from "react";
import { AmazonBookBanner } from "@/components/AmazonBookBanner";
import { isNewTool, type Tool } from "@/lib/tools";

type ToolShellProps = {
  tool: Tool;
  children: ReactNode;
};

export function ToolShell({ tool, children }: ToolShellProps) {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="no-print mb-5 overflow-hidden rounded-full">
        <div className="snap-ribbon" aria-hidden>
          <span className="bg-bg-accent" />
          <span className="bg-secondary" />
          <span className="bg-accent" />
        </div>
      </div>
      <p className="no-print text-xs font-semibold uppercase tracking-wider text-accent">
        {isNewTool(tool) ? (
          <span className="text-secondary">New · </span>
        ) : null}
        {tool.status === "live" ? "Live" : "Coming soon"}
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
        {tool.title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-muted">
        {tool.description}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        <span className="font-medium text-ink">Who:</span> {tool.audience}
      </p>
      <div className="no-print mt-5 rounded-xl border-2 border-line bg-surface-muted px-4 py-3 text-sm leading-relaxed text-ink">
        <p className="font-semibold text-secondary">How to practice</p>
        <p className="mt-1 text-ink">{tool.howTo}</p>
      </div>
      <div className="mt-8">{children}</div>
      <AmazonBookBanner books={tool.books} />
    </article>
  );
}
