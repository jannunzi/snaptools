import type { Metadata } from "next";
import Link from "next/link";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SkillMapList } from "@/components/SkillMap";
import {
  getCurriculumMapByCategory,
  getCurriculumSummary,
} from "@/lib/curriculum";

export const metadata: Metadata = {
  title: "Skill map",
  description:
    "What FactsTools covers by subject and skill — and the gaps still open.",
};

export default function LearnPage() {
  const groups = getCurriculumMapByCategory();
  const summary = getCurriculumSummary();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageBreadcrumb
        items={[{ href: "/", label: "Tools" }, { label: "Skill map" }]}
      />
      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] text-ink sm:text-5xl">
        Skill map
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
        Each tool still works on its own. This map shows the skills they cover
        and the gaps with no tool yet.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        {summary.liveCount} of {summary.skillCount} skills have a tool
        <span className="mx-1.5 text-line">·</span>
        {summary.gapCount} {summary.gapCount === 1 ? "gap" : "gaps"}
      </p>
      <p className="mt-3">
        <Link href="/grades" className="snap-link text-sm">
          Browse by grade
        </Link>
      </p>
      <SkillMapList groups={groups} />
    </div>
  );
}
