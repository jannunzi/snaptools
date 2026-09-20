import {
  TOOL_CATEGORIES,
  getLiveTools,
  getTool,
  type Tool,
  type ToolCategoryId,
} from "./tools";

export const GRADE_IDS = [
  "prek",
  "k",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "college",
] as const;

export type GradeId = (typeof GRADE_IDS)[number];

export type Grade = {
  id: GradeId;
  label: string;
  shortLabel: string;
  title: string;
};

export const GRADES: readonly Grade[] = GRADE_IDS.map((id) => {
  if (id === "prek") {
    return { id, label: "Pre-K", shortLabel: "Pre-K", title: "Pre-K" };
  }
  if (id === "k") {
    return { id, label: "K", shortLabel: "K", title: "Kindergarten" };
  }
  if (id === "college") {
    return { id, label: "College", shortLabel: "College", title: "College" };
  }
  return { id, label: id, shortLabel: id, title: `Grade ${id}` };
});

const GRADE_BY_ID = new Map(GRADES.map((grade) => [grade.id, grade]));
const GRADE_INDEX = new Map(GRADE_IDS.map((id, index) => [id, index]));

export type Skill = {
  id: string;
  label: string;
  category: ToolCategoryId;
  grades: readonly GradeId[];
  prerequisites?: readonly string[];
  blurb: string;
};

export type ToolCurriculumTag = {
  slug: string;
  skillIds: readonly string[];
  grades: readonly GradeId[];
};

export const SKILLS: readonly Skill[] = [
  {
    id: "counting",
    label: "Counting",
    category: "math",
    grades: ["prek", "k"],
    blurb:
      "Name how many, count forward and back, and match a set to a number.",
  },
  {
    id: "skip-counting",
    label: "Skip counting",
    category: "math",
    grades: ["k", "1", "2"],
    prerequisites: ["counting"],
    blurb: "Count by 2s, 5s, and 10s — the path into multiplication.",
  },
  {
    id: "number-bonds",
    label: "Number bonds",
    category: "math",
    grades: ["k", "1"],
    prerequisites: ["counting"],
    blurb: "Split and join numbers to 10 so addition facts have a picture.",
  },
  {
    id: "addition-facts",
    label: "Addition facts",
    category: "math",
    grades: ["k", "1", "2", "3"],
    prerequisites: ["counting", "number-bonds"],
    blurb: "Sums through 20 with instant recall, not finger counting.",
  },
  {
    id: "subtraction-facts",
    label: "Subtraction facts",
    category: "math",
    grades: ["1", "2", "3"],
    prerequisites: ["addition-facts"],
    blurb: "Differences through 20 — the inverse of the addition facts.",
  },
  {
    id: "place-value",
    label: "Place value",
    category: "math",
    grades: ["2", "3", "4", "5"],
    prerequisites: ["counting"],
    blurb:
      "Name the place and value of a digit, expanded form, compare, and round.",
  },
  {
    id: "telling-time",
    label: "Telling time",
    category: "math",
    grades: ["1", "2", "3"],
    prerequisites: ["counting"],
    blurb: "Read an analog clock from whole hours through to the minute.",
  },
  {
    id: "counting-money",
    label: "Counting money",
    category: "math",
    grades: ["1", "2", "3"],
    prerequisites: ["addition-facts"],
    blurb: "Count US coins and bills, then make change from a price.",
  },
  {
    id: "multiplication",
    label: "Multiplication",
    category: "math",
    grades: ["3", "4", "5"],
    prerequisites: ["addition-facts", "skip-counting"],
    blurb: "The 1–12 tables until the product is automatic.",
  },
  {
    id: "division",
    label: "Division",
    category: "math",
    grades: ["3", "4", "5"],
    prerequisites: ["multiplication"],
    blurb: "Exact facts for divisors 1–12 — the inverse of the tables.",
  },
  {
    id: "fractions",
    label: "Fractions",
    category: "math",
    grades: ["3", "4", "5", "6"],
    prerequisites: ["division", "place-value"],
    blurb:
      "Identify, simplify, compare, and operate on fractions with models.",
  },
  {
    id: "rounding",
    label: "Rounding",
    category: "math",
    grades: ["3", "4"],
    prerequisites: ["place-value"],
    blurb: "Round a whole number to a named place.",
  },
  {
    id: "decimals",
    label: "Decimals",
    category: "math",
    grades: ["4", "5", "6"],
    prerequisites: ["place-value", "fractions"],
    blurb: "Read, compare, and compute with tenths, hundredths, and thousandths.",
  },
  {
    id: "percents",
    label: "Percents",
    category: "math",
    grades: ["5", "6", "7"],
    prerequisites: ["decimals"],
    blurb: "Move among fractions, decimals, and percents.",
  },
  {
    id: "order-of-operations",
    label: "Order of operations",
    category: "math",
    grades: ["5", "6"],
    prerequisites: ["multiplication", "division"],
    blurb: "Evaluate mixed expressions with parentheses, ×, ÷, +, and −.",
  },
  {
    id: "integers",
    label: "Integers",
    category: "math",
    grades: ["6", "7"],
    prerequisites: ["subtraction-facts"],
    blurb: "Add and subtract positive and negative numbers on a number line.",
  },
  {
    id: "ratios",
    label: "Ratios",
    category: "math",
    grades: ["6", "7"],
    prerequisites: ["fractions"],
    blurb: "Compare quantities with ratios, rates, and simple proportions.",
  },
  {
    id: "area-perimeter",
    label: "Area and perimeter",
    category: "math",
    grades: ["3", "4", "5"],
    prerequisites: ["multiplication"],
    blurb: "Measure rectangles and composite shapes — around and inside.",
  },
  {
    id: "volume",
    label: "Volume",
    category: "math",
    grades: ["5", "6"],
    prerequisites: ["area-perimeter"],
    blurb: "Find the volume of rectangular prisms in cubic units.",
  },
  {
    id: "angles",
    label: "Angles",
    category: "math",
    grades: ["4", "5", "6"],
    blurb: "Name, estimate, and measure acute, right, and obtuse angles.",
  },
  {
    id: "phonics",
    label: "Phonics",
    category: "languages",
    grades: ["prek", "k", "1"],
    blurb: "Hear letter sounds and blend them into words.",
  },
  {
    id: "handwriting",
    label: "Handwriting",
    category: "languages",
    grades: ["prek", "k"],
    blurb: "Form letters and write a name with a steady stroke.",
  },
  {
    id: "sight-words",
    label: "Sight words",
    category: "languages",
    grades: ["prek", "k", "1", "2", "3"],
    prerequisites: ["phonics"],
    blurb: "Recognize high-frequency Dolch words on sight.",
  },
  {
    id: "spelling",
    label: "Spelling",
    category: "languages",
    grades: ["1", "2", "3", "4", "5"],
    prerequisites: ["sight-words", "phonics"],
    blurb: "Hear a word and type the spelling in English, Spanish, or French.",
  },
  {
    id: "reading-fluency",
    label: "Reading fluency",
    category: "languages",
    grades: ["1", "2", "3"],
    prerequisites: ["sight-words", "phonics"],
    blurb: "Read connected text accurately and at a conversational pace.",
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    category: "languages",
    grades: ["2", "3", "4", "5"],
    prerequisites: ["sight-words"],
    blurb: "Learn word meaning from context and short definitions.",
  },
  {
    id: "grammar",
    label: "Grammar",
    category: "languages",
    grades: ["3", "4", "5"],
    prerequisites: ["spelling"],
    blurb: "Use parts of speech, punctuation, and complete sentences.",
  },
  {
    id: "continents-oceans",
    label: "Continents and oceans",
    category: "history-civics",
    grades: ["2", "3", "4"],
    blurb: "Name the seven continents and five oceans on a world map.",
  },
  {
    id: "map-skills",
    label: "Map skills",
    category: "history-civics",
    grades: ["3", "4", "5"],
    prerequisites: ["continents-oceans"],
    blurb: "Read a key, compass rose, and simple political map.",
  },
  {
    id: "states-capitals",
    label: "States and capitals",
    category: "history-civics",
    grades: ["3", "4", "5"],
    prerequisites: ["map-skills"],
    blurb: "Name each US state and its capital.",
  },
  {
    id: "us-presidents",
    label: "US presidents",
    category: "history-civics",
    grades: ["4", "5", "6"],
    prerequisites: ["states-capitals"],
    blurb: "Place presidents in order and match a name to a term.",
  },
  {
    id: "history-timeline",
    label: "History timeline",
    category: "history-civics",
    grades: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "college"],
    blurb: "Line up world events across eras, categories, and zoom levels.",
  },
  {
    id: "us-constitution",
    label: "US Constitution",
    category: "history-civics",
    grades: ["8", "9", "10", "11", "12"],
    prerequisites: ["history-timeline"],
    blurb: "The branches, amendments, and how a bill becomes law.",
  },
  {
    id: "civics",
    label: "Civics",
    category: "history-civics",
    grades: ["8", "9", "10", "11", "12", "college"],
    prerequisites: ["us-constitution"],
    blurb: "The 2025 USCIS civics bank — rights, government, and history.",
  },
  {
    id: "coloring",
    label: "Coloring",
    category: "arts",
    grades: ["prek", "k", "1", "2", "3"],
    blurb: "Quiet line-art pages to color on screen or on paper.",
  },
  {
    id: "drawing-shapes",
    label: "Drawing shapes",
    category: "arts",
    grades: ["prek", "k", "1"],
    blurb: "Circles, squares, and simple objects from a few strokes.",
  },
  {
    id: "rhythm",
    label: "Rhythm",
    category: "arts",
    grades: ["k", "1", "2", "3"],
    blurb: "Clap and name whole, half, quarter, and eighth notes.",
  },
  {
    id: "music-notes",
    label: "Music notes",
    category: "arts",
    grades: ["1", "2", "3", "4", "5", "6"],
    prerequisites: ["rhythm"],
    blurb: "Name the note on a treble staff — lines, then spaces.",
  },
  {
    id: "bass-clef",
    label: "Bass clef",
    category: "arts",
    grades: ["3", "4", "5", "6"],
    prerequisites: ["music-notes"],
    blurb: "Read notes on the bass staff after the treble facts are solid.",
  },
];

export const TOOL_CURRICULUM: readonly ToolCurriculumTag[] = [
  {
    slug: "addition-subtraction-facts",
    skillIds: ["addition-facts", "subtraction-facts"],
    grades: ["k", "1", "2", "3"],
  },
  {
    slug: "counting-money",
    skillIds: ["counting-money"],
    grades: ["1", "2", "3"],
  },
  {
    slug: "division-facts",
    skillIds: ["division"],
    grades: ["3", "4", "5"],
  },
  {
    slug: "fractions-practice",
    skillIds: ["fractions"],
    grades: ["3", "4", "5", "6"],
  },
  {
    slug: "multiplication-tables",
    skillIds: ["multiplication"],
    grades: ["3", "4", "5"],
  },
  {
    slug: "place-value",
    skillIds: ["place-value"],
    grades: ["2", "3", "4", "5"],
  },
  {
    slug: "telling-time",
    skillIds: ["telling-time"],
    grades: ["1", "2", "3"],
  },
  {
    slug: "civics-quiz",
    skillIds: ["civics"],
    grades: ["8", "9", "10", "11", "12", "college"],
  },
  {
    slug: "history-timeline",
    skillIds: ["history-timeline"],
    grades: ["4", "5", "6", "7", "8", "9", "10", "11", "12", "college"],
  },
  {
    slug: "states-and-capitals",
    skillIds: ["states-capitals"],
    grades: ["3", "4", "5"],
  },
  {
    slug: "sight-words",
    skillIds: ["sight-words"],
    grades: ["prek", "k", "1", "2", "3"],
  },
  {
    slug: "spelling-practice",
    skillIds: ["spelling"],
    grades: ["1", "2", "3", "4", "5"],
  },
  {
    slug: "music-note-recognition",
    skillIds: ["music-notes"],
    grades: ["1", "2", "3", "4", "5", "6"],
  },
  {
    slug: "printable-coloring",
    skillIds: ["coloring"],
    grades: ["prek", "k", "1", "2", "3"],
  },
];

const SKILL_BY_ID = new Map(SKILLS.map((skill) => [skill.id, skill]));
const TOOL_TAG_BY_SLUG = new Map(
  TOOL_CURRICULUM.map((tag) => [tag.slug, tag]),
);

export type SkillCoverage = {
  skill: Skill;
  tools: Tool[];
  liveCount: number;
  isGap: boolean;
};

export type CurriculumFilter = {
  category?: ToolCategoryId;
  grade?: GradeId;
};

export type CategorySkillMap = {
  id: ToolCategoryId;
  label: string;
  skills: SkillCoverage[];
  liveCount: number;
  gapCount: number;
};

export type GradeCoverage = {
  grade: Grade;
  skills: SkillCoverage[];
  liveCount: number;
  gapCount: number;
};

export type CurriculumSnapshot = {
  generatedFor: "daily-tool-gaps";
  grades: readonly Grade[];
  skills: Array<
    Skill & {
      toolSlugs: string[];
      isGap: boolean;
    }
  >;
  gaps: string[];
  tools: readonly ToolCurriculumTag[];
};

export function isGradeId(value: string): value is GradeId {
  return GRADE_BY_ID.has(value as GradeId);
}

export function getGrade(id: string): Grade | undefined {
  return GRADE_BY_ID.get(id as GradeId);
}

export function requireGrade(id: string): Grade {
  const grade = getGrade(id);
  if (!grade) {
    throw new Error(`Unknown grade id: ${id}`);
  }
  return grade;
}

export function getSkill(id: string): Skill | undefined {
  return SKILL_BY_ID.get(id);
}

export function requireSkill(id: string): Skill {
  const skill = getSkill(id);
  if (!skill) {
    throw new Error(`Unknown skill id: ${id}`);
  }
  return skill;
}

export function getToolCurriculum(slug: string): ToolCurriculumTag | undefined {
  return TOOL_TAG_BY_SLUG.get(slug);
}

export function sortGradeIds(grades: readonly GradeId[]): GradeId[] {
  return [...grades].sort(
    (a, b) => (GRADE_INDEX.get(a) ?? 0) - (GRADE_INDEX.get(b) ?? 0),
  );
}

export function formatGradeBand(grades: readonly GradeId[]): string {
  const ordered = sortGradeIds(grades);
  if (ordered.length === 0) return "";

  const ranges: Array<[GradeId, GradeId]> = [];
  let start = ordered[0];
  let prev = ordered[0];

  for (const id of ordered.slice(1)) {
    const prevIndex = GRADE_INDEX.get(prev) ?? 0;
    const nextIndex = GRADE_INDEX.get(id) ?? 0;
    if (nextIndex === prevIndex + 1) {
      prev = id;
      continue;
    }
    ranges.push([start, prev]);
    start = id;
    prev = id;
  }
  ranges.push([start, prev]);

  return ranges
    .map(([from, to]) => {
      const fromLabel = GRADE_BY_ID.get(from)?.shortLabel ?? from;
      const toLabel = GRADE_BY_ID.get(to)?.shortLabel ?? to;
      return from === to ? fromLabel : `${fromLabel}–${toLabel}`;
    })
    .join(", ");
}

function matchesFilter(skill: Skill, filter?: CurriculumFilter): boolean {
  if (!filter) return true;
  if (filter.category && skill.category !== filter.category) return false;
  if (filter.grade && !skill.grades.includes(filter.grade)) return false;
  return true;
}

export function getSkillsForGrade(
  gradeId: GradeId,
  list: readonly Skill[] = SKILLS,
): Skill[] {
  return list.filter((skill) => skill.grades.includes(gradeId));
}

export function getSkillsForTool(slug: string): Skill[] {
  const tag = getToolCurriculum(slug);
  if (!tag) return [];
  return tag.skillIds
    .map((id) => getSkill(id))
    .filter((skill): skill is Skill => Boolean(skill));
}

export function getGradesForTool(slug: string): Grade[] {
  const tag = getToolCurriculum(slug);
  if (!tag) return [];
  return sortGradeIds(tag.grades)
    .map((id) => getGrade(id))
    .filter((grade): grade is Grade => Boolean(grade));
}

export function getPrerequisiteSkills(skill: Skill): Skill[] {
  return (skill.prerequisites ?? [])
    .map((id) => getSkill(id))
    .filter((item): item is Skill => Boolean(item));
}

export function getDependentSkills(skillId: string): Skill[] {
  return SKILLS.filter((skill) => skill.prerequisites?.includes(skillId));
}

export function getToolsForSkill(
  skillId: string,
  list: readonly Tool[] = getLiveTools(),
): Tool[] {
  const slugs = TOOL_CURRICULUM.filter((tag) =>
    tag.skillIds.includes(skillId),
  ).map((tag) => tag.slug);

  return slugs
    .map((slug) => list.find((tool) => tool.slug === slug) ?? getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));
}

export function getSkillCoverage(
  skill: Skill,
  list: readonly Tool[] = getLiveTools(),
): SkillCoverage {
  const tools = getToolsForSkill(skill.id, list).filter(
    (tool) => tool.status === "live",
  );
  return {
    skill,
    tools,
    liveCount: tools.length,
    isGap: tools.length === 0,
  };
}

export function getAllSkillCoverage(
  filter?: CurriculumFilter,
  list: readonly Tool[] = getLiveTools(),
): SkillCoverage[] {
  return SKILLS.filter((skill) => matchesFilter(skill, filter)).map((skill) =>
    getSkillCoverage(skill, list),
  );
}

/** Skills with zero live tools — what the daily-tool routine can build next. */
export function getGapSkills(
  filter?: CurriculumFilter,
  list: readonly Tool[] = getLiveTools(),
): Skill[] {
  return getAllSkillCoverage(filter, list)
    .filter((item) => item.isGap)
    .map((item) => item.skill);
}

export function getCoveredSkills(
  filter?: CurriculumFilter,
  list: readonly Tool[] = getLiveTools(),
): Skill[] {
  return getAllSkillCoverage(filter, list)
    .filter((item) => !item.isGap)
    .map((item) => item.skill);
}

export function getCurriculumMapByCategory(
  filter?: CurriculumFilter,
  list: readonly Tool[] = getLiveTools(),
): CategorySkillMap[] {
  return TOOL_CATEGORIES.map((category) => {
    const skills = getAllSkillCoverage(
      { ...filter, category: category.id },
      list,
    );
    return {
      id: category.id,
      label: category.label,
      skills,
      liveCount: skills.filter((item) => !item.isGap).length,
      gapCount: skills.filter((item) => item.isGap).length,
    };
  }).filter((group) => group.skills.length > 0);
}

export function getGradeCoverage(
  gradeId: GradeId,
  list: readonly Tool[] = getLiveTools(),
): GradeCoverage {
  const grade = requireGrade(gradeId);
  const skills = getAllSkillCoverage({ grade: gradeId }, list);
  return {
    grade,
    skills,
    liveCount: skills.filter((item) => !item.isGap).length,
    gapCount: skills.filter((item) => item.isGap).length,
  };
}

export function getAllGradeCoverage(
  list: readonly Tool[] = getLiveTools(),
): GradeCoverage[] {
  return GRADE_IDS.map((id) => getGradeCoverage(id, list));
}

export function getCurriculumSummary(list: readonly Tool[] = getLiveTools()) {
  const coverage = getAllSkillCoverage(undefined, list);
  const liveCount = coverage.filter((item) => !item.isGap).length;
  return {
    skillCount: coverage.length,
    liveCount,
    gapCount: coverage.length - liveCount,
    taggedToolCount: TOOL_CURRICULUM.length,
  };
}

export function exportCurriculumSnapshot(
  list: readonly Tool[] = getLiveTools(),
): CurriculumSnapshot {
  const coverage = getAllSkillCoverage(undefined, list);
  return {
    generatedFor: "daily-tool-gaps",
    grades: GRADES,
    skills: coverage.map((item) => ({
      ...item.skill,
      toolSlugs: item.tools.map((tool) => tool.slug),
      isGap: item.isGap,
    })),
    gaps: coverage.filter((item) => item.isGap).map((item) => item.skill.id),
    tools: TOOL_CURRICULUM,
  };
}

export function formatCurriculumGapReport(
  filter?: CurriculumFilter,
  list: readonly Tool[] = getLiveTools(),
): string {
  const gaps = getGapSkills(filter, list);
  const header = filter?.grade
    ? `Curriculum gaps for ${requireGrade(filter.grade).title}`
    : filter?.category
      ? `Curriculum gaps for ${filter.category}`
      : "Curriculum gaps";

  const lines = [
    `${header} (${gaps.length} skill${gaps.length === 1 ? "" : "s"} with no live tool)`,
    "",
  ];

  if (gaps.length === 0) {
    lines.push("None — every skill in this filter has a live tool.");
    return lines.join("\n");
  }

  for (const skill of gaps) {
    lines.push(
      `- ${skill.id}\t${skill.label}\t${skill.category}\t${formatGradeBand(skill.grades)}`,
    );
  }

  return lines.join("\n");
}

export function getCurriculumIssues(): string[] {
  const issues: string[] = [];
  const skillIds = new Set<string>();

  for (const skill of SKILLS) {
    if (skillIds.has(skill.id)) {
      issues.push(`Duplicate skill id: ${skill.id}`);
    }
    skillIds.add(skill.id);

    if (skill.grades.length === 0) {
      issues.push(`Skill ${skill.id} has no grade bands`);
    }
    for (const gradeId of skill.grades) {
      if (!isGradeId(gradeId)) {
        issues.push(`Skill ${skill.id} has unknown grade: ${gradeId}`);
      }
    }
    for (const prereq of skill.prerequisites ?? []) {
      if (!SKILL_BY_ID.has(prereq)) {
        issues.push(`Skill ${skill.id} has unknown prerequisite: ${prereq}`);
      }
    }
  }

  const taggedSlugs = new Set<string>();
  for (const tag of TOOL_CURRICULUM) {
    if (taggedSlugs.has(tag.slug)) {
      issues.push(`Duplicate tool curriculum tag: ${tag.slug}`);
    }
    taggedSlugs.add(tag.slug);

    if (!getTool(tag.slug)) {
      issues.push(`Curriculum tag points at unknown tool: ${tag.slug}`);
    }
    if (tag.skillIds.length === 0) {
      issues.push(`Tool ${tag.slug} has no skills`);
    }
    if (tag.grades.length === 0) {
      issues.push(`Tool ${tag.slug} has no grades`);
    }
    for (const skillId of tag.skillIds) {
      if (!SKILL_BY_ID.has(skillId)) {
        issues.push(`Tool ${tag.slug} has unknown skill: ${skillId}`);
      }
    }
    for (const gradeId of tag.grades) {
      if (!isGradeId(gradeId)) {
        issues.push(`Tool ${tag.slug} has unknown grade: ${gradeId}`);
      }
    }
  }

  for (const tool of getLiveTools()) {
    if (!taggedSlugs.has(tool.slug)) {
      issues.push(`Live tool is missing curriculum tags: ${tool.slug}`);
    }
  }

  return issues;
}

export function assertCurriculum() {
  const issues = getCurriculumIssues();
  if (issues.length > 0) {
    throw new Error(`Invalid curriculum:\n${issues.join("\n")}`);
  }
}

assertCurriculum();
