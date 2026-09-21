import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertCurriculum,
  exportCurriculumSnapshot,
  formatCurriculumGapReport,
  formatGradeBand,
  getGapSkills,
  getGradeCoverage,
  getPrerequisiteSkills,
  getSkill,
  getSkillCoverage,
  getSkillsForGrade,
  getSkillsForTool,
  getToolsForSkill,
  getCurriculumIssues,
  getCurriculumSummary,
  SKILLS,
  TOOL_CURRICULUM,
} from "./curriculum";
import { getLiveTools } from "./tools";

test("curriculum data is internally consistent", () => {
  assert.deepEqual(getCurriculumIssues(), []);
  assert.doesNotThrow(() => assertCurriculum());
});

test("every live tool is tagged with skills and grades", () => {
  const tagged = new Set(TOOL_CURRICULUM.map((tag) => tag.slug));
  for (const tool of getLiveTools()) {
    assert.ok(tagged.has(tool.slug), `${tool.slug} is missing curriculum tags`);
    const skills = getSkillsForTool(tool.slug);
    assert.ok(skills.length > 0, `${tool.slug} has no skills`);
  }
});

test("multiplication is covered and decimals is a gap", () => {
  const multiplication = getSkillCoverage(getSkill("multiplication")!);
  assert.equal(multiplication.isGap, false);
  assert.ok(
    multiplication.tools.some((tool) => tool.slug === "multiplication-tables"),
  );

  const skipCounting = getSkillCoverage(getSkill("skip-counting")!);
  assert.equal(skipCounting.isGap, false);
  assert.ok(
    skipCounting.tools.some((tool) => tool.slug === "skip-counting"),
  );

  const decimals = getSkillCoverage(getSkill("decimals")!);
  assert.equal(decimals.isGap, true);
  assert.equal(decimals.liveCount, 0);
  assert.ok(getGapSkills().some((skill) => skill.id === "decimals"));
});

test("grade 3 browse includes multiplication and area-perimeter gap", () => {
  const skillIds = getSkillsForGrade("3").map((skill) => skill.id);
  assert.ok(skillIds.includes("multiplication"));
  assert.ok(skillIds.includes("area-perimeter"));

  const grade = getGradeCoverage("3");
  assert.ok(grade.liveCount > 0);
  assert.ok(grade.gapCount > 0);
  assert.ok(
    grade.skills.some(
      (item) => item.skill.id === "area-perimeter" && item.isGap,
    ),
  );
});

test("prerequisites resolve and addition-subtraction maps to two skills", () => {
  const division = getSkill("division")!;
  assert.deepEqual(
    getPrerequisiteSkills(division).map((skill) => skill.id),
    ["multiplication"],
  );
  assert.deepEqual(
    getSkillsForTool("addition-subtraction-facts").map((skill) => skill.id),
    ["addition-facts", "subtraction-facts"],
  );
  assert.ok(
    getToolsForSkill("addition-facts").some(
      (tool) => tool.slug === "addition-subtraction-facts",
    ),
  );
});

test("gap report and snapshot export skills with zero tools", () => {
  const report = formatCurriculumGapReport();
  assert.match(report, /decimals/);
  assert.doesNotMatch(report, /skip-counting\t/);
  assert.doesNotMatch(report, /multiplication\t/);

  const snapshot = exportCurriculumSnapshot();
  assert.equal(snapshot.generatedFor, "daily-tool-gaps");
  assert.ok(snapshot.gaps.includes("bass-clef"));
  assert.ok(!snapshot.gaps.includes("coloring"));
  assert.equal(snapshot.skills.length, SKILLS.length);

  const summary = getCurriculumSummary();
  assert.equal(summary.gapCount + summary.liveCount, summary.skillCount);
  assert.ok(summary.gapCount > 0);
  assert.equal(summary.taggedToolCount, getLiveTools().length);
});

test("formatGradeBand compresses consecutive grades", () => {
  assert.equal(formatGradeBand(["3", "4", "5"]), "3–5");
  assert.equal(formatGradeBand(["prek", "k", "1"]), "Pre-K–1");
  assert.equal(formatGradeBand(["college"]), "College");
  assert.equal(formatGradeBand(["8", "9", "10", "11", "12", "college"]), "8–College");
});
