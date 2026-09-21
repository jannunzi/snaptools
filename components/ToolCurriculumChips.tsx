import Link from "next/link";
import {
  formatGradeBand,
  getGradesForTool,
  getSkillsForTool,
} from "@/lib/curriculum";

export function ToolCurriculumChips({ slug }: { slug: string }) {
  const grades = getGradesForTool(slug);
  const skills = getSkillsForTool(slug);

  if (grades.length === 0 && skills.length === 0) {
    return null;
  }

  return (
    <div className="no-print mt-4 flex flex-col gap-3">
      {grades.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Grades
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {grades.map((grade) => (
              <li key={grade.id}>
                <Link
                  href={`/grades/${grade.id}`}
                  className="inline-flex min-h-8 items-center rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-ink transition-colors hover:border-secondary/40"
                >
                  {grade.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="sr-only">Grade band {formatGradeBand(grades.map((grade) => grade.id))}</p>
        </div>
      ) : null}
      {skills.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Skills
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <li key={skill.id}>
                <Link
                  href={`/skills/${skill.id}`}
                  className="inline-flex min-h-8 items-center rounded-full border border-line bg-surface px-2.5 text-xs font-medium text-ink transition-colors hover:border-secondary/40"
                >
                  {skill.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
