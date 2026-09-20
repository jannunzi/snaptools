import Link from "next/link";
import {
  GRADES,
  type Grade,
  type GradeCoverage,
} from "@/lib/curriculum";

export function GradeChipRow({ grades }: { grades: readonly Grade[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {grades.map((grade) => (
        <li key={grade.id}>
          <Link
            href={`/grades/${grade.id}`}
            className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-secondary/40"
          >
            {grade.shortLabel}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function HomepageGradeBrowse() {
  return (
    <section className="mt-16" aria-labelledby="browse-grades-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id="browse-grades-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
        >
          Browse by grade
        </h2>
        <Link href="/learn" className="snap-link text-sm">
          Skill map
        </Link>
      </div>
      <GradeChipRow grades={GRADES} />
    </section>
  );
}

export function GradeCoverageGrid({
  coverage,
}: {
  coverage: readonly GradeCoverage[];
}) {
  return (
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {coverage.map((item) => (
        <Link
          key={item.grade.id}
          href={`/grades/${item.grade.id}`}
          className="snap-panel block transition-colors hover:border-secondary/35"
        >
          <h2 className="font-display text-2xl text-ink">{item.grade.title}</h2>
          <p className="mt-2 text-sm text-ink-muted">
            {item.liveCount} with a tool
            <span className="mx-1.5 text-line">·</span>
            {item.gapCount} {item.gapCount === 1 ? "gap" : "gaps"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {item.skills.length}{" "}
            {item.skills.length === 1 ? "skill" : "skills"}
          </p>
        </Link>
      ))}
    </div>
  );
}
