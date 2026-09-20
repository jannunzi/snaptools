import type { Metadata } from "next";
import Link from "next/link";
import { GradeCoverageGrid } from "@/components/GradeBrowse";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { getAllGradeCoverage, getCurriculumSummary } from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Grades",
  description:
    "Browse FactsTools by grade band — Pre-K through College — then pick a skill.",
};

export default function GradesPage() {
  const coverage = getAllGradeCoverage();
  const summary = getCurriculumSummary();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageBreadcrumb
        items={[{ href: "/", label: "Tools" }, { label: "Grades" }]}
      />
      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] text-ink sm:text-5xl">
        Browse by grade
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
        Pick a grade to see the skills for that band, the tools that exist, and
        the gaps still open.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        {summary.liveCount} skills with a tool
        <span className="mx-1.5 text-line">·</span>
        {summary.gapCount} {summary.gapCount === 1 ? "gap" : "gaps"}
      </p>
      <p className="mt-3">
        <Link href="/learn" className="snap-link text-sm">
          See the skill map
        </Link>
      </p>
      <GradeCoverageGrid coverage={coverage} />
    </div>
  );
}
