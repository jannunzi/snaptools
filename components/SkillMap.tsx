import Link from "next/link";
import {
  formatGradeBand,
  getPrerequisiteSkills,
  type CategorySkillMap,
  type SkillCoverage,
} from "@/lib/curriculum";

function SkillStatus({ item }: { item: SkillCoverage }) {
  if (item.isGap) {
    return <span className="snap-badge snap-badge-muted">Coming soon</span>;
  }
  return (
    <span className="snap-badge snap-badge-live">
      {item.liveCount} {item.liveCount === 1 ? "tool" : "tools"}
    </span>
  );
}

export function SkillRow({
  item,
}: {
  item: SkillCoverage;
}) {
  const prereqs = getPrerequisiteSkills(item.skill);
  const href = `/skills/${item.skill.id}`;

  return (
    <li>
      <Link
        href={href}
        className="snap-panel block transition-colors hover:border-secondary/35"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl text-ink">{item.skill.label}</h3>
            <p className="mt-1 text-sm text-ink-muted">
              {formatGradeBand(item.skill.grades)}
            </p>
          </div>
          <SkillStatus item={item} />
        </div>
        {prereqs.length > 0 ? (
          <p className="mt-3 text-sm text-ink-muted">
            After {prereqs.map((skill) => skill.label).join(", ")}
          </p>
        ) : null}
        {item.isGap ? (
          <p className="mt-3 text-sm text-ink-muted">Coming soon.</p>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            {item.tools.map((tool) => tool.title).join(" · ")}
          </p>
        )}
      </Link>
    </li>
  );
}

export function SkillMapList({
  groups,
}: {
  groups: readonly CategorySkillMap[];
}) {
  return (
    <div className="mt-10 space-y-14">
      {groups.map((group) => (
        <section key={group.id} aria-labelledby={`map-${group.id}`}>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2
              id={`map-${group.id}`}
              className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted"
            >
              {group.label}
            </h2>
            <p className="text-sm text-ink-muted">
              {group.liveCount} live
              <span className="mx-1.5 text-line">·</span>
              {group.gapCount} coming soon
            </p>
          </div>
          <ol className="mt-4 grid gap-3">
            {group.skills.map((item) => (
              <SkillRow key={item.skill.id} item={item} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
