import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SkillMapList } from "@/components/SkillMap";
import {
  GRADE_IDS,
  getCurriculumMapByCategory,
  getGrade,
  isGradeId,
} from "@/lib/curriculum";

type GradePageProps = PageProps<"/grades/[grade]">;

export function generateStaticParams() {
  return GRADE_IDS.map((grade) => ({ grade }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: GradePageProps): Promise<Metadata> {
  const { grade: gradeId } = await params;
  const grade = getGrade(gradeId);
  if (!grade) {
    return { title: "Grade not found" };
  }

  return {
    title: grade.title,
    description: `Skills and tools for ${grade.title}, including what is coming soon.`,
  };
}

export default async function GradePage({ params }: GradePageProps) {
  const { grade: gradeId } = await params;
  if (!isGradeId(gradeId)) notFound();

  const grade = getGrade(gradeId);
  if (!grade) notFound();

  const groups = getCurriculumMapByCategory({ grade: grade.id });
  const liveCount = groups.reduce((sum, group) => sum + group.liveCount, 0);
  const gapCount = groups.reduce((sum, group) => sum + group.gapCount, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <PageBreadcrumb
        items={[
          { href: "/", label: "Tools" },
          { href: "/grades", label: "Grades" },
          { label: grade.title },
        ]}
      />
      <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] text-ink sm:text-5xl">
        {grade.title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
        Subjects and skills for this grade. Open a skill to practice, or see
        what is coming soon.
      </p>
      <p className="mt-4 text-sm text-ink-muted">
        {liveCount} with a tool
        <span className="mx-1.5 text-line">·</span>
        {gapCount} coming soon
      </p>
      <SkillMapList groups={groups} />
    </div>
  );
}
