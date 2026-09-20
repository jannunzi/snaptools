import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { ToolCard } from "@/components/ToolCard";
import {
  SKILLS,
  formatGradeBand,
  getDependentSkills,
  getGrade,
  getPrerequisiteSkills,
  getSkill,
  getSkillCoverage,
} from "@/lib/curriculum";
import { getCategoryLabel } from "@/lib/tools";

type SkillPageProps = PageProps<"/skills/[skill]">;

export function generateStaticParams() {
  return SKILLS.map((skill) => ({ skill: skill.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: SkillPageProps): Promise<Metadata> {
  const { skill: skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) {
    return { title: "Skill not found" };
  }

  return {
    title: skill.label,
    description: skill.blurb,
  };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { skill: skillId } = await params;
  const skill = getSkill(skillId);
  if (!skill) notFound();

  const coverage = getSkillCoverage(skill);
  const prereqs = getPrerequisiteSkills(skill);
  const nextSkills = getDependentSkills(skill.id);
  const grades = skill.grades
    .map((id) => getGrade(id))
    .filter((grade): grade is NonNullable<typeof grade> => Boolean(grade));

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageBreadcrumb
        items={[
          { href: "/", label: "Tools" },
          { href: "/learn", label: "Skill map" },
          { label: skill.label },
        ]}
      />
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
          {getCategoryLabel(skill.category)}
        </span>
        {coverage.isGap ? (
          <span className="snap-badge snap-badge-muted">Gap</span>
        ) : (
          <span className="snap-badge snap-badge-live">
            {coverage.liveCount}{" "}
            {coverage.liveCount === 1 ? "tool" : "tools"}
          </span>
        )}
      </div>
      <h1 className="mt-4 font-display text-[2.25rem] leading-[1.1] text-ink sm:text-5xl">
        {skill.label}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
        {skill.blurb}
      </p>
      <p className="mt-3 text-sm text-ink-muted">
        {formatGradeBand(skill.grades)}
      </p>

      <section className="mt-8" aria-labelledby="skill-grades-heading">
        <h2
          id="skill-grades-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
        >
          Grades
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {grades.map((grade) => (
            <li key={grade.id}>
              <Link
                href={`/grades/${grade.id}`}
                className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-secondary/40"
              >
                {grade.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {prereqs.length > 0 ? (
        <section className="mt-8" aria-labelledby="skill-prereq-heading">
          <h2
            id="skill-prereq-heading"
            className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
          >
            After
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {prereqs.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/skills/${item.id}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-secondary/40"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="skill-tools-heading">
        <h2
          id="skill-tools-heading"
          className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
        >
          Tools
        </h2>
        {coverage.isGap ? (
          <div className="snap-panel mt-4">
            <p className="font-display text-xl text-ink">No tool yet</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
              This skill is a gap. Each tool still stands alone — the map just
              shows what is missing so the next practice tool is easy to pick.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {coverage.tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </section>

      {nextSkills.length > 0 ? (
        <section className="mt-10" aria-labelledby="skill-next-heading">
          <h2
            id="skill-next-heading"
            className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
          >
            Leads to
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {nextSkills.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/skills/${item.id}`}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface px-3 text-sm text-ink transition-colors hover:border-secondary/40"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
