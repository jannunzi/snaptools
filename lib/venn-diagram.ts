/**
 * Venn Diagram lab. Two or three sets inside a universal set U.
 * Region paths are circle-arc cycles, so the shading matches the formula.
 * Counts use inclusion–exclusion. The center is added back because the
 * pairwise overlaps subtracted it once too often.
 */

const MINUS = "−";
const TAU = Math.PI * 2;

export type SetCount = 2 | 3;

export type RegionId =
  | "onlyA"
  | "onlyB"
  | "onlyC"
  | "ab"
  | "bc"
  | "ca"
  | "abc"
  | "outside";

export type CircleId = "A" | "B" | "C";

export type ExpressionId =
  | "union"
  | "intersection"
  | "onlyA"
  | "onlyB"
  | "onlyC"
  | "symDiff"
  | "neither"
  | "complementA"
  | "complementB"
  | "complementC"
  | "atLeastOne"
  | "exactlyOne"
  | "exactlyTwo"
  | "allThree"
  | "abOnly"
  | "bcOnly"
  | "caOnly"
  | "setA"
  | "setB"
  | "setC"
  | "pairAB"
  | "pairBC"
  | "pairCA"
  | "universe";

export type Counts = Record<RegionId, number>;

export type LabMode = "explore" | "problem" | "demorgan";

export type Representation = "counts" | "elements";

export type ElementSets = {
  universe: string[];
  A: string[];
  B: string[];
  C: string[];
};

export type MemberDraft = {
  U: string;
  A: string;
  B: string;
  C: string;
};

export type ElementReading = {
  title: string;
  left: string;
  roster: string;
  equation: string;
  builder: string;
  spoken: string;
  elements: string[];
};

export type DeMorganSide = {
  title: string;
  spoken: string;
  builder: string;
  builderSpoken: string;
  regions: readonly RegionId[];
};

export type DeMorganPair = {
  id: "complement-union" | "complement-intersection";
  law: string;
  spoken: string;
  why: string;
  left: DeMorganSide;
  right: DeMorganSide;
};

type Pt = { x: number; y: number };

type Circle = { id: CircleId; cx: number; cy: number; r: number };

type DirectedArc = {
  region: RegionId;
  start: Pt;
  end: Pt;
  startKey: string;
  endKey: string;
  r: number;
  cx: number;
  cy: number;
  a0: number;
  span: number;
  large: 0 | 1;
  sweep: 0 | 1;
  sample: Pt;
};

export type DiagramRegion = {
  id: RegionId;
  d: string;
  labelX: number;
  labelY: number;
};

export type DiagramCircle = Circle & { labelX: number; labelY: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type Diagram = {
  sets: SetCount;
  width: number;
  height: number;
  viewBox: string;
  rect: Rect;
  outsideLabel: Pt;
  circles: DiagramCircle[];
  regions: DiagramRegion[];
};

export type FormulaTerm = {
  sign: "" | "+" | "−";
  label: string;
  spoken: string;
  value: number;
};

export type FormulaStep = {
  left: string;
  leftSpoken: string;
  symbolic: string;
  symbolicSpoken: string;
  terms: FormulaTerm[];
  total: number;
};

export type FormulaModel = {
  id: ExpressionId | null;
  title: string;
  steps: FormulaStep[];
  total: number;
  why: string;
  announcement: string;
};

export type ExpressionChoice = {
  id: ExpressionId;
  label: string;
  aria: string;
};

export type WordProblem = {
  id: string;
  sets: SetCount;
  title: string;
  prompt: string;
  ask: string;
  labels: { A: string; B: string; C?: string };
  given: string[];
  solution: Counts;
  steps: string[];
};

export type GradeRow = {
  id: RegionId;
  expected: number;
  actual: number | null;
  ok: boolean;
};

const ZERO_COUNTS: Counts = {
  onlyA: 0,
  onlyB: 0,
  onlyC: 0,
  ab: 0,
  bc: 0,
  ca: 0,
  abc: 0,
  outside: 0,
};

export const DEFAULT_COUNTS_2: Counts = {
  ...ZERO_COUNTS,
  onlyA: 20,
  onlyB: 15,
  ab: 10,
  outside: 5,
};

export const DEFAULT_COUNTS_3: Counts = {
  onlyA: 12,
  onlyB: 10,
  onlyC: 8,
  ab: 5,
  bc: 4,
  ca: 3,
  abc: 2,
  outside: 6,
};

export function defaultCounts(sets: SetCount): Counts {
  return sets === 2 ? { ...DEFAULT_COUNTS_2 } : { ...DEFAULT_COUNTS_3 };
}

export function regionsFor(sets: SetCount): RegionId[] {
  if (sets === 2) return ["onlyA", "onlyB", "ab", "outside"];
  return ["onlyA", "onlyB", "onlyC", "ab", "bc", "ca", "abc", "outside"];
}

export function regionName(id: RegionId, sets: SetCount): string {
  switch (id) {
    case "onlyA":
      return "Only A";
    case "onlyB":
      return "Only B";
    case "onlyC":
      return "Only C";
    case "ab":
      return sets === 2 ? "A ∩ B" : "A ∩ B only";
    case "bc":
      return "B ∩ C only";
    case "ca":
      return "C ∩ A only";
    case "abc":
      return "A ∩ B ∩ C";
    case "outside":
      return "Neither";
    default: {
      const never: never = id;
      return never;
    }
  }
}

export function regionSpoken(id: RegionId, sets: SetCount): string {
  switch (id) {
    case "onlyA":
      return "only A";
    case "onlyB":
      return "only B";
    case "onlyC":
      return "only C";
    case "ab":
      return sets === 2 ? "A and B" : "A and B but not C";
    case "bc":
      return "B and C but not A";
    case "ca":
      return "C and A but not B";
    case "abc":
      return "A and B and C";
    case "outside":
      return "neither";
    default: {
      const never: never = id;
      return never;
    }
  }
}

type Derived = {
  nA: number;
  nB: number;
  nC: number;
  nAB: number;
  nBC: number;
  nCA: number;
  nABC: number;
  nUnion: number;
  nU: number;
};

export function derive(counts: Counts, sets: SetCount): Derived {
  const nABC = sets === 3 ? counts.abc : 0;
  const nAB = counts.ab + nABC;
  const nBC = sets === 3 ? counts.bc + nABC : 0;
  const nCA = sets === 3 ? counts.ca + nABC : 0;
  const nA =
    counts.onlyA + counts.ab + (sets === 3 ? counts.ca + counts.abc : 0);
  const nB =
    counts.onlyB + counts.ab + (sets === 3 ? counts.bc + counts.abc : 0);
  const nC =
    sets === 3 ? counts.onlyC + counts.bc + counts.ca + counts.abc : 0;
  const inside =
    sets === 2
      ? counts.onlyA + counts.onlyB + counts.ab
      : counts.onlyA +
        counts.onlyB +
        counts.onlyC +
        counts.ab +
        counts.bc +
        counts.ca +
        counts.abc;
  return {
    nA,
    nB,
    nC,
    nAB,
    nBC,
    nCA,
    nABC,
    nUnion: inside,
    nU: inside + counts.outside,
  };
}

function sumRegions(counts: Counts, regions: readonly RegionId[]) {
  return regions.reduce((total, id) => total + counts[id], 0);
}

type Pattern = {
  id: ExpressionId;
  sets: SetCount;
  regions: readonly RegionId[];
  title: string;
  button?: string;
  aria?: string;
};

const PATTERNS: readonly Pattern[] = [
  {
    id: "union",
    sets: 2,
    regions: ["onlyA", "onlyB", "ab"],
    title: "Union",
    button: "A ∪ B",
    aria: "Union of A and B",
  },
  {
    id: "intersection",
    sets: 2,
    regions: ["ab"],
    title: "Intersection",
    button: "A ∩ B",
    aria: "Intersection of A and B",
  },
  {
    id: "onlyA",
    sets: 2,
    regions: ["onlyA"],
    title: "Only A",
    button: "Only A",
    aria: "Elements only in A",
  },
  {
    id: "onlyB",
    sets: 2,
    regions: ["onlyB"],
    title: "Only B",
    button: "Only B",
    aria: "Elements only in B",
  },
  {
    id: "symDiff",
    sets: 2,
    regions: ["onlyA", "onlyB"],
    title: "Symmetric difference",
    button: "A Δ B",
    aria: "Symmetric difference of A and B",
  },
  {
    id: "neither",
    sets: 2,
    regions: ["outside"],
    title: "Neither",
    button: "Neither",
    aria: "Neither A nor B, the complement of the union",
  },
  {
    id: "complementA",
    sets: 2,
    regions: ["onlyB", "outside"],
    title: "Complement of A",
    button: "A′",
    aria: "Complement of A",
  },
  {
    id: "complementB",
    sets: 2,
    regions: ["onlyA", "outside"],
    title: "Complement of B",
  },
  {
    id: "setA",
    sets: 2,
    regions: ["onlyA", "ab"],
    title: "Set A",
  },
  {
    id: "setB",
    sets: 2,
    regions: ["onlyB", "ab"],
    title: "Set B",
  },
  {
    id: "universe",
    sets: 2,
    regions: ["onlyA", "onlyB", "ab", "outside"],
    title: "Universal set",
  },
  {
    id: "atLeastOne",
    sets: 3,
    regions: ["onlyA", "onlyB", "onlyC", "ab", "bc", "ca", "abc"],
    title: "At least one",
    button: "At least one",
    aria: "At least one of A, B, and C",
  },
  {
    id: "exactlyOne",
    sets: 3,
    regions: ["onlyA", "onlyB", "onlyC"],
    title: "Exactly one",
    button: "Exactly one",
    aria: "Exactly one of A, B, and C",
  },
  {
    id: "exactlyTwo",
    sets: 3,
    regions: ["ab", "bc", "ca"],
    title: "Exactly two",
    button: "Exactly two",
    aria: "Exactly two of A, B, and C",
  },
  {
    id: "allThree",
    sets: 3,
    regions: ["abc"],
    title: "All three",
    button: "All three",
    aria: "Elements in all three sets",
  },
  {
    id: "onlyA",
    sets: 3,
    regions: ["onlyA"],
    title: "Only A",
    button: "Only A",
    aria: "Elements only in A",
  },
  {
    id: "onlyB",
    sets: 3,
    regions: ["onlyB"],
    title: "Only B",
    button: "Only B",
    aria: "Elements only in B",
  },
  {
    id: "onlyC",
    sets: 3,
    regions: ["onlyC"],
    title: "Only C",
    button: "Only C",
    aria: "Elements only in C",
  },
  {
    id: "neither",
    sets: 3,
    regions: ["outside"],
    title: "Neither",
    button: "Neither",
    aria: "In none of A, B, or C",
  },
  {
    id: "complementA",
    sets: 3,
    regions: ["onlyB", "onlyC", "bc", "outside"],
    title: "Complement of A",
    button: "A′",
    aria: "Complement of A",
  },
  {
    id: "complementB",
    sets: 3,
    regions: ["onlyA", "onlyC", "ca", "outside"],
    title: "Complement of B",
  },
  {
    id: "complementC",
    sets: 3,
    regions: ["onlyA", "onlyB", "ab", "outside"],
    title: "Complement of C",
  },
  {
    id: "abOnly",
    sets: 3,
    regions: ["ab"],
    title: "A ∩ B only",
  },
  {
    id: "bcOnly",
    sets: 3,
    regions: ["bc"],
    title: "B ∩ C only",
  },
  {
    id: "caOnly",
    sets: 3,
    regions: ["ca"],
    title: "C ∩ A only",
  },
  {
    id: "pairAB",
    sets: 3,
    regions: ["ab", "abc"],
    title: "A ∩ B",
  },
  {
    id: "pairBC",
    sets: 3,
    regions: ["bc", "abc"],
    title: "B ∩ C",
  },
  {
    id: "pairCA",
    sets: 3,
    regions: ["ca", "abc"],
    title: "C ∩ A",
  },
  {
    id: "setA",
    sets: 3,
    regions: ["onlyA", "ab", "ca", "abc"],
    title: "Set A",
  },
  {
    id: "setB",
    sets: 3,
    regions: ["onlyB", "ab", "bc", "abc"],
    title: "Set B",
  },
  {
    id: "setC",
    sets: 3,
    regions: ["onlyC", "bc", "ca", "abc"],
    title: "Set C",
  },
  {
    id: "universe",
    sets: 3,
    regions: ["onlyA", "onlyB", "onlyC", "ab", "bc", "ca", "abc", "outside"],
    title: "Universal set",
  },
];

function signature(regions: readonly RegionId[]) {
  return [...regions].sort().join("|");
}

function patternFor(id: ExpressionId, sets: SetCount) {
  const pattern = PATTERNS.find((item) => item.id === id && item.sets === sets);
  if (!pattern) throw new Error(`Missing pattern ${id} for ${sets} sets`);
  return pattern;
}

export function expressionChoices(sets: SetCount): ExpressionChoice[] {
  return PATTERNS.filter((item) => item.sets === sets && item.button && item.aria).map(
    (item) => ({
      id: item.id,
      label: item.button as string,
      aria: item.aria as string,
    }),
  );
}

export function regionsOf(id: ExpressionId, sets: SetCount): RegionId[] {
  return [...patternFor(id, sets).regions];
}

export function matchExpression(
  shaded: readonly RegionId[],
  sets: SetCount,
): ExpressionId | null {
  if (shaded.length === 0) return null;
  const key = signature(shaded);
  const matches = PATTERNS.filter(
    (item) => item.sets === sets && signature(item.regions) === key,
  );
  if (matches.length === 0) return null;
  const button = matches.find((item) => item.button);
  return (button ?? matches[0]).id;
}

function term(sign: FormulaTerm["sign"], label: string, spoken: string, value: number): FormulaTerm {
  return { sign, label, spoken, value };
}

function substitution(terms: readonly FormulaTerm[]) {
  return terms
    .map((item, index) => {
      const number = String(item.value);
      if (index === 0) return item.sign === "−" ? `${MINUS}${number}` : number;
      return `${item.sign} ${number}`;
    })
    .join(" ");
}

function substitutionSpoken(terms: readonly FormulaTerm[]) {
  return terms
    .map((item, index) => {
      const number = String(item.value);
      if (index === 0) return item.sign === "−" ? `minus ${number}` : number;
      if (item.sign === "−") return `minus ${number}`;
      return `plus ${number}`;
    })
    .join(" ");
}

function step(
  left: string,
  leftSpoken: string,
  symbolic: string,
  symbolicSpoken: string,
  terms: FormulaTerm[],
  total: number,
): FormulaStep {
  return { left, leftSpoken, symbolic, symbolicSpoken, terms, total };
}

function evalTerms(terms: readonly FormulaTerm[]) {
  return terms.reduce((total, item) => {
    return item.sign === "−" ? total - item.value : total + item.value;
  }, 0);
}

export function formulaFor(
  id: ExpressionId | null,
  counts: Counts,
  sets: SetCount,
  shaded: readonly RegionId[],
): FormulaModel {
  const totals = derive(counts, sets);
  if (!id) {
    const regions = regionsFor(sets).filter((region) => shaded.includes(region));
    const terms = regions.map((region, index) =>
      term(
        index === 0 ? "" : "+",
        regionName(region, sets),
        regionSpoken(region, sets),
        counts[region],
      ),
    );
    const total = sumRegions(counts, regions);
    const why =
      regions.length === 0
        ? "Shade a region, or pick a formula."
        : "No standard formula uses exactly these regions.";
    const list = regions.map((region) => regionSpoken(region, sets));
    const announcement =
      regions.length === 0
        ? "Nothing is shaded."
        : `Custom shading. ${joinList(list)}. Shaded count ${substitutionSpoken(terms)} equals ${total}. ${why}`;
    return {
      id: null,
      title: regions.length === 0 ? "Nothing shaded" : "Custom shading",
      steps:
        regions.length === 0
          ? []
          : [
              step(
                "Shaded count",
                "shaded count",
                regions.map((region) => regionName(region, sets)).join(" + "),
                regions.map((region) => regionSpoken(region, sets)).join(" plus "),
                terms,
                total,
              ),
            ],
      total,
      why,
      announcement,
    };
  }

  const pattern = patternFor(id, sets);
  const built = buildFormula(id, sets, counts, totals);
  const regionList = pattern.regions.map((region) => regionSpoken(region, sets));
  const announcement = `${pattern.title}. Shaded: ${joinList(regionList)}. ${built.steps
    .map(
      (item) =>
        `${item.leftSpoken} equals ${item.symbolicSpoken}, which is ${substitutionSpoken(item.terms)}, equals ${item.total}.`,
    )
    .join(" ")} ${built.why}`;
  return {
    id,
    title: pattern.title,
    steps: built.steps,
    total: built.total,
    why: built.why,
    announcement,
  };
}

function buildFormula(
  id: ExpressionId,
  sets: SetCount,
  counts: Counts,
  totals: Derived,
): { steps: FormulaStep[]; total: number; why: string } {
  const shadedTotal = sumRegions(counts, patternFor(id, sets).regions);

  if (id === "union" || id === "atLeastOne") {
    if (sets === 2) {
      const terms = [
        term("", "n(A)", "n of A", totals.nA),
        term("+", "n(B)", "n of B", totals.nB),
        term("−", "n(A ∩ B)", "n of A intersect B", totals.nAB),
      ];
      const total = evalTerms(terms);
      return {
        steps: [
          step(
            "n(A ∪ B)",
            "n of A union B",
            "n(A) + n(B) − n(A ∩ B)",
            "n of A plus n of B minus n of A intersect B",
            terms,
            total,
          ),
        ],
        total,
        why: "The overlap sits in both n(A) and n(B), so it is subtracted once.",
      };
    }
    const terms = [
      term("", "n(A)", "n of A", totals.nA),
      term("+", "n(B)", "n of B", totals.nB),
      term("+", "n(C)", "n of C", totals.nC),
      term("−", "n(A ∩ B)", "n of A intersect B", totals.nAB),
      term("−", "n(B ∩ C)", "n of B intersect C", totals.nBC),
      term("−", "n(C ∩ A)", "n of C intersect A", totals.nCA),
      term("+", "n(A ∩ B ∩ C)", "n of A intersect B intersect C", totals.nABC),
    ];
    return {
      steps: [
        step(
          "n(A ∪ B ∪ C)",
          "n of A union B union C",
          "n(A) + n(B) + n(C) − n(A ∩ B) − n(B ∩ C) − n(C ∩ A) + n(A ∩ B ∩ C)",
          "n of A plus n of B plus n of C minus the three pairwise overlaps plus n of A intersect B intersect C",
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why: "The center was added in all three sets, then subtracted in all three overlaps, which wipes it out. Add it back once.",
    };
  }

  if (id === "intersection" || id === "allThree" || id === "pairAB" || id === "pairBC" || id === "pairCA") {
    if (sets === 2 || id === "pairAB") {
      const total = totals.nAB;
      return {
        steps: [
          step(
            "n(A ∩ B)",
            "n of A intersect B",
            "n(A ∩ B)",
            "n of A intersect B",
            [term("", "n(A ∩ B)", "n of A intersect B", total)],
            total,
          ),
        ],
        total,
        why:
          sets === 3
            ? "This overlap includes the center. Union subtracts it, then adds the center back."
            : "This is the overlap itself. Union subtracts it because n(A) and n(B) both include it.",
      };
    }
    if (id === "pairBC") {
      return simpleCount("n(B ∩ C)", "n of B intersect C", totals.nBC, "This overlap includes the center.");
    }
    if (id === "pairCA") {
      return simpleCount("n(C ∩ A)", "n of C intersect A", totals.nCA, "This overlap includes the center.");
    }
    return simpleCount(
      "n(A ∩ B ∩ C)",
      "n of A intersect B intersect C",
      totals.nABC,
      "The center is in every pairwise overlap. The union formula adds it back after those subtractions.",
    );
  }

  if (id === "onlyA") {
    if (sets === 2) {
      const terms = [
        term("", "n(A)", "n of A", totals.nA),
        term("−", "n(A ∩ B)", "n of A intersect B", totals.nAB),
      ];
      return {
        steps: [
          step(
            "n(A − B)",
            "n of A minus B",
            "n(A) − n(A ∩ B)",
            "n of A minus n of A intersect B",
            terms,
            evalTerms(terms),
          ),
        ],
        total: evalTerms(terms),
        why: "Start with A, then remove the part that is also in B.",
      };
    }
    return onlyOneStep("A", "B", "C", totals.nA, totals.nAB, totals.nCA, totals.nABC);
  }

  if (id === "onlyB") {
    if (sets === 2) {
      const terms = [
        term("", "n(B)", "n of B", totals.nB),
        term("−", "n(A ∩ B)", "n of A intersect B", totals.nAB),
      ];
      return {
        steps: [
          step(
            "n(B − A)",
            "n of B minus A",
            "n(B) − n(A ∩ B)",
            "n of B minus n of A intersect B",
            terms,
            evalTerms(terms),
          ),
        ],
        total: evalTerms(terms),
        why: "Start with B, then remove the part that is also in A.",
      };
    }
    return onlyOneStep("B", "A", "C", totals.nB, totals.nAB, totals.nBC, totals.nABC);
  }

  if (id === "onlyC") {
    return onlyOneStep("C", "A", "B", totals.nC, totals.nCA, totals.nBC, totals.nABC);
  }

  if (id === "symDiff") {
    const terms = [
      term("", "n(A)", "n of A", totals.nA),
      term("+", "n(B)", "n of B", totals.nB),
      term("−", "2n(A ∩ B)", "2 times n of A intersect B", 2 * totals.nAB),
    ];
    return {
      steps: [
        step(
          "n(A Δ B)",
          "n of A symmetric difference B",
          "n(A) + n(B) − 2n(A ∩ B)",
          "n of A plus n of B minus 2 times n of A intersect B",
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why: "The overlap is in both sets. Subtract it twice so it is not left in the total.",
    };
  }

  if (id === "neither") {
    const unionLabel = sets === 2 ? "n(A ∪ B)" : "n(A ∪ B ∪ C)";
    const unionSpoken = sets === 2 ? "n of A union B" : "n of A union B union C";
    const left = sets === 2 ? "n((A ∪ B)′)" : "n((A ∪ B ∪ C)′)";
    const leftSpoken =
      sets === 2 ? "n of the complement of A union B" : "n of the complement of A union B union C";
    const terms = [
      term("", "n(U)", "n of U", totals.nU),
      term("−", unionLabel, unionSpoken, totals.nUnion),
    ];
    return {
      steps: [
        step(
          left,
          leftSpoken,
          `n(U) − ${unionLabel}`,
          `n of U minus ${unionSpoken}`,
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why:
        sets === 2
          ? "Take the whole universal set and remove everything in A or B."
          : "Take the whole universal set and remove everything in at least one set.",
    };
  }

  if (id === "complementA" || id === "complementB" || id === "complementC") {
    const which = id === "complementA" ? "A" : id === "complementB" ? "B" : "C";
    const value = which === "A" ? totals.nA : which === "B" ? totals.nB : totals.nC;
    const terms = [
      term("", "n(U)", "n of U", totals.nU),
      term("−", `n(${which})`, `n of ${which}`, value),
    ];
    return {
      steps: [
        step(
          `n(${which}′)`,
          `n of the complement of ${which}`,
          `n(U) − n(${which})`,
          `n of U minus n of ${which}`,
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why: `Take the whole universal set and remove ${which}.`,
    };
  }

  if (id === "exactlyOne") {
    const onlyA = onlyOneStep("A", "B", "C", totals.nA, totals.nAB, totals.nCA, totals.nABC);
    const onlyB = onlyOneStep("B", "A", "C", totals.nB, totals.nAB, totals.nBC, totals.nABC);
    const onlyC = onlyOneStep("C", "A", "B", totals.nC, totals.nCA, totals.nBC, totals.nABC);
    const parts = [onlyA, onlyB, onlyC];
    const terms = [
      term("", "n(only A)", "n of only A", onlyA.total),
      term("+", "n(only B)", "n of only B", onlyB.total),
      term("+", "n(only C)", "n of only C", onlyC.total),
    ];
    return {
      steps: [
        ...parts.flatMap((item) => item.steps),
        step(
          "n(exactly one)",
          "n of exactly one",
          "n(only A) + n(only B) + n(only C)",
          "n of only A plus n of only B plus n of only C",
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why: "Subtract both overlaps from the set, then add the center back. It belongs to the set and was removed twice.",
    };
  }

  if (id === "exactlyTwo") {
    const terms = [
      term("", "n(A ∩ B)", "n of A intersect B", totals.nAB),
      term("+", "n(B ∩ C)", "n of B intersect C", totals.nBC),
      term("+", "n(C ∩ A)", "n of C intersect A", totals.nCA),
      term("−", "3n(A ∩ B ∩ C)", "3 times n of A intersect B intersect C", 3 * totals.nABC),
    ];
    return {
      steps: [
        step(
          "n(exactly two)",
          "n of exactly two",
          "n(A ∩ B) + n(B ∩ C) + n(C ∩ A) − 3n(A ∩ B ∩ C)",
          "the three pairwise overlaps minus 3 times the center",
          terms,
          evalTerms(terms),
        ),
      ],
      total: evalTerms(terms),
      why: "Each pairwise count includes the center, so the center was counted three times. Subtract it three times.",
    };
  }

  if (id === "abOnly") {
    return lensOnly("A", "B", "C", totals.nAB, totals.nABC);
  }
  if (id === "bcOnly") {
    return lensOnly("B", "C", "A", totals.nBC, totals.nABC);
  }
  if (id === "caOnly") {
    return lensOnly("C", "A", "B", totals.nCA, totals.nABC);
  }

  if (id === "setA" || id === "setB" || id === "setC") {
    const which = id === "setA" ? "A" : id === "setB" ? "B" : "C";
    const value = which === "A" ? totals.nA : which === "B" ? totals.nB : totals.nC;
    return simpleCount(
      `n(${which})`,
      `n of ${which}`,
      value,
      "Add the regions inside the circle. Each element is in exactly one of them.",
    );
  }

  if (id === "universe") {
    return simpleCount(
      "n(U)",
      "n of U",
      totals.nU,
      "Every element is in exactly one region of the diagram.",
    );
  }

  return simpleCount("Shaded count", "shaded count", shadedTotal, "");
}

function simpleCount(left: string, leftSpoken: string, total: number, why: string) {
  return {
    steps: [
      step(left, leftSpoken, left, leftSpoken, [term("", left, leftSpoken, total)], total),
    ],
    total,
    why,
  };
}

function orderedPair(left: string, right: string) {
  const rank = (letter: string) => letter.charCodeAt(0);
  return rank(left) <= rank(right) ? [left, right] : [right, left];
}

function pairSymbol(left: string, right: string) {
  const [a, b] = orderedPair(left, right);
  return `n(${a} ∩ ${b})`;
}

function pairSpoken(left: string, right: string) {
  const [a, b] = orderedPair(left, right);
  return `n of ${a} intersect ${b}`;
}

function onlyOneStep(
  set: string,
  other: string,
  third: string,
  nSet: number,
  nPairOther: number,
  nPairThird: number,
  nCenter: number,
) {
  const terms = [
    term("", `n(${set})`, `n of ${set}`, nSet),
    term("−", pairSymbol(set, other), pairSpoken(set, other), nPairOther),
    term("−", pairSymbol(set, third), pairSpoken(set, third), nPairThird),
    term("+", "n(A ∩ B ∩ C)", "n of A intersect B intersect C", nCenter),
  ];
  const total = evalTerms(terms);
  return {
    steps: [
      step(
        `n(only ${set})`,
        `n of only ${set}`,
        `n(${set}) − ${pairSymbol(set, other)} − ${pairSymbol(set, third)} + n(A ∩ B ∩ C)`,
        `n of ${set} minus both overlaps plus the center`,
        terms,
        total,
      ),
    ],
    total,
    why: "Subtract both overlaps, then add the center back. It was removed twice.",
  };
}

function lensOnly(left: string, right: string, other: string, pair: number, center: number) {
  const symbol = pairSymbol(left, right);
  const spoken = pairSpoken(left, right);
  const terms = [
    term("", symbol, spoken, pair),
    term("−", "n(A ∩ B ∩ C)", "n of A intersect B intersect C", center),
  ];
  return {
    steps: [
      step(
        `n(${symbol.slice(2, -1)} only)`,
        `n of ${orderedPair(left, right).join(" and ")} but not ${other}`,
        `${symbol} − n(A ∩ B ∩ C)`,
        `${spoken} minus the center`,
        terms,
        evalTerms(terms),
      ),
    ],
    total: evalTerms(terms),
    why: "The full pairwise overlap includes the center. Subtract the center to leave the lens.",
  };
}

function joinList(items: readonly string[]) {
  if (items.length === 0) return "nothing";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function formatSubstitution(terms: readonly FormulaTerm[]) {
  return substitution(terms);
}

function blankCounts(): Counts {
  return { ...ZERO_COUNTS };
}

function solve2(nU: number, nA: number, nB: number, nAB: number): Counts {
  const counts = blankCounts();
  counts.ab = nAB;
  counts.onlyA = nA - nAB;
  counts.onlyB = nB - nAB;
  counts.outside = nU - (counts.onlyA + counts.onlyB + counts.ab);
  return counts;
}

function solve3(
  nU: number,
  nA: number,
  nB: number,
  nC: number,
  nAB: number,
  nBC: number,
  nCA: number,
  nABC: number,
): Counts {
  const counts = blankCounts();
  counts.abc = nABC;
  counts.ab = nAB - nABC;
  counts.bc = nBC - nABC;
  counts.ca = nCA - nABC;
  counts.onlyA = nA - counts.ab - counts.ca - counts.abc;
  counts.onlyB = nB - counts.ab - counts.bc - counts.abc;
  counts.onlyC = nC - counts.bc - counts.ca - counts.abc;
  const inside =
    counts.onlyA +
    counts.onlyB +
    counts.onlyC +
    counts.ab +
    counts.bc +
    counts.ca +
    counts.abc;
  counts.outside = nU - inside;
  return counts;
}

function problem2(input: {
  id: string;
  title: string;
  labels: { A: string; B: string };
  nU: number;
  nA: number;
  nB: number;
  nAB: number;
  verb: string;
}): WordProblem {
  const solution = solve2(input.nU, input.nA, input.nB, input.nAB);
  const { A, B } = input.labels;
  return {
    id: input.id,
    sets: 2,
    title: input.title,
    prompt: `A group of ${input.nU} students. Some ${input.verb} ${A}, some ${input.verb} ${B}, and some ${input.verb} both.`,
    ask: "Fill in every region, including students in neither.",
    labels: input.labels,
    given: [
      `${input.nU} students in all`,
      `${input.nA} ${input.verb} ${A}`,
      `${input.nB} ${input.verb} ${B}`,
      `${input.nAB} ${input.verb} both`,
    ],
    solution,
    steps: [
      `Both is given: ${input.nAB}.`,
      `Only ${A} is ${input.nA} − ${input.nAB} = ${solution.onlyA}.`,
      `Only ${B} is ${input.nB} − ${input.nAB} = ${solution.onlyB}.`,
      `Neither is ${input.nU} − (${solution.onlyA} + ${solution.onlyB} + ${input.nAB}) = ${solution.outside}.`,
    ],
  };
}

function problem3(input: {
  id: string;
  title: string;
  labels: { A: string; B: string; C: string };
  nU: number;
  nA: number;
  nB: number;
  nC: number;
  nAB: number;
  nBC: number;
  nCA: number;
  nABC: number;
  verb: string;
}): WordProblem {
  const solution = solve3(
    input.nU,
    input.nA,
    input.nB,
    input.nC,
    input.nAB,
    input.nBC,
    input.nCA,
    input.nABC,
  );
  const { A, B, C } = input.labels;
  const inside = input.nU - solution.outside;
  return {
    id: input.id,
    sets: 3,
    title: input.title,
    prompt: `A group of ${input.nU} students. The totals count people more than once when they ${input.verb} two or three of these.`,
    ask: "Fill in every region, including students in none of them.",
    labels: input.labels,
    given: [
      `${input.nU} students in all`,
      `${input.nA} ${input.verb} ${A}`,
      `${input.nB} ${input.verb} ${B}`,
      `${input.nC} ${input.verb} ${C}`,
      `${input.nAB} ${input.verb} ${A} and ${B}`,
      `${input.nBC} ${input.verb} ${B} and ${C}`,
      `${input.nCA} ${input.verb} ${C} and ${A}`,
      `${input.nABC} ${input.verb} all three`,
    ],
    solution,
    steps: [
      `All three is given: ${input.nABC}.`,
      `${A} and ${B}, but not ${C}: ${input.nAB} − ${input.nABC} = ${solution.ab}.`,
      `${B} and ${C}, but not ${A}: ${input.nBC} − ${input.nABC} = ${solution.bc}.`,
      `${C} and ${A}, but not ${B}: ${input.nCA} − ${input.nABC} = ${solution.ca}.`,
      `Only ${A}: ${input.nA} − ${solution.ab} − ${solution.ca} − ${input.nABC} = ${solution.onlyA}.`,
      `Only ${B}: ${input.nB} − ${solution.ab} − ${solution.bc} − ${input.nABC} = ${solution.onlyB}.`,
      `Only ${C}: ${input.nC} − ${solution.bc} − ${solution.ca} − ${input.nABC} = ${solution.onlyC}.`,
      `Neither is ${input.nU} − ${inside} = ${solution.outside}.`,
    ],
  };
}

export const WORD_PROBLEMS: readonly WordProblem[] = [
  problem2({
    id: "soccer-chess",
    title: "Soccer and chess",
    labels: { A: "soccer", B: "chess" },
    nU: 30,
    nA: 18,
    nB: 15,
    nAB: 8,
    verb: "play",
  }),
  problem2({
    id: "band-choir",
    title: "Band and choir",
    labels: { A: "band", B: "choir" },
    nU: 40,
    nA: 22,
    nB: 16,
    nAB: 6,
    verb: "are in",
  }),
  problem3({
    id: "soccer-chess-music",
    title: "Soccer, chess, and music",
    labels: { A: "soccer", B: "chess", C: "music" },
    nU: 40,
    nA: 20,
    nB: 16,
    nC: 18,
    nAB: 8,
    nBC: 7,
    nCA: 9,
    nABC: 4,
    verb: "play",
  }),
  problem3({
    id: "art-drama-robots",
    title: "Art, drama, and robots",
    labels: { A: "art", B: "drama", C: "robots" },
    nU: 50,
    nA: 28,
    nB: 23,
    nC: 20,
    nAB: 12,
    nBC: 9,
    nCA: 8,
    nABC: 5,
    verb: "are in",
  }),
];

export function gradeProblem(
  problem: WordProblem,
  drafts: Partial<Record<RegionId, string>>,
): { results: GradeRow[]; matched: number; total: number; correct: boolean } {
  const results = regionsFor(problem.sets).map((id) => {
    const raw = (drafts[id] ?? "").trim();
    const actual = /^(?:0|[1-9]\d{0,2})$/.test(raw) ? Number(raw) : null;
    return {
      id,
      expected: problem.solution[id],
      actual,
      ok: actual === problem.solution[id],
    };
  });
  const matched = results.filter((row) => row.ok).length;
  return {
    results,
    matched,
    total: results.length,
    correct: matched === results.length,
  };
}

export function emptyDraft(): Record<RegionId, string> {
  return {
    onlyA: "",
    onlyB: "",
    onlyC: "",
    ab: "",
    bc: "",
    ca: "",
    abc: "",
    outside: "",
  };
}

export function draftFromSolution(problem: WordProblem): Record<RegionId, string> {
  const draft = emptyDraft();
  for (const id of regionsFor(problem.sets)) {
    draft[id] = String(problem.solution[id]);
  }
  return draft;
}

function circleIntersections(a: Circle, b: Circle): Pt[] {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d = Math.hypot(dx, dy);
  if (d <= 1e-6 || d >= a.r + b.r || d <= Math.abs(a.r - b.r)) return [];
  const along = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(0, a.r * a.r - along * along));
  const mx = a.cx + (along * dx) / d;
  const my = a.cy + (along * dy) / d;
  const ox = (-dy * height) / d;
  const oy = (dx * height) / d;
  return [
    { x: mx + ox, y: my + oy },
    { x: mx - ox, y: my - oy },
  ];
}

function pointKey(point: Pt) {
  return `${point.x.toFixed(4)},${point.y.toFixed(4)}`;
}

function angleOf(circle: Circle, point: Pt) {
  return Math.atan2(point.y - circle.cy, point.x - circle.cx);
}

function regionAt(point: Pt, circles: readonly Circle[], sets: SetCount): RegionId {
  const inside = new Set<CircleId>();
  for (const circle of circles) {
    const dx = point.x - circle.cx;
    const dy = point.y - circle.cy;
    if (dx * dx + dy * dy < circle.r * circle.r - 0.25) inside.add(circle.id);
  }
  const a = inside.has("A");
  const b = inside.has("B");
  const c = sets === 3 && inside.has("C");
  if (a && b && c) return "abc";
  if (a && b) return "ab";
  if (b && c) return "bc";
  if (c && a) return "ca";
  if (a) return "onlyA";
  if (b) return "onlyB";
  if (c) return "onlyC";
  return "outside";
}

function layoutFor(sets: SetCount): { width: number; height: number; rect: Rect; circles: Circle[] } {
  if (sets === 2) {
    return {
      width: 640,
      height: 420,
      rect: { x: 36, y: 28, w: 568, h: 364 },
      circles: [
        { id: "A", cx: 250, cy: 214, r: 118 },
        { id: "B", cx: 398, cy: 214, r: 118 },
      ],
    };
  }
  const r = 112;
  const distance = 132;
  const rise = (distance * Math.sqrt(3)) / 2;
  const cx = 320;
  const baseY = 292;
  return {
    width: 640,
    height: 500,
    rect: { x: 28, y: 18, w: 584, h: 464 },
    circles: [
      { id: "A", cx, cy: baseY - rise, r },
      { id: "B", cx: cx - distance / 2, cy: baseY, r },
      { id: "C", cx: cx + distance / 2, cy: baseY, r },
    ],
  };
}

function chainRegion(arcs: DirectedArc[]): DirectedArc[] {
  if (arcs.length === 0) throw new Error("Region has no arcs");
  const unused = new Set(arcs);
  const start = arcs[0];
  const path = [start];
  unused.delete(start);
  let current = start;
  while (unused.size > 0) {
    const next = [...unused].find((arc) => arc.startKey === current.endKey);
    if (!next) break;
    path.push(next);
    unused.delete(next);
    current = next;
    if (current.endKey === start.startKey) break;
  }
  if (unused.size > 0 || current.endKey !== start.startKey) {
    throw new Error(`Region ${start.region} did not close (${unused.size} arcs left)`);
  }
  return path;
}

function pathFromArcs(arcs: readonly DirectedArc[]) {
  const digits = (value: number) => value.toFixed(2);
  const parts = [`M ${digits(arcs[0].start.x)} ${digits(arcs[0].start.y)}`];
  for (const arc of arcs) {
    parts.push(
      `A ${digits(arc.r)} ${digits(arc.r)} 0 ${arc.large} ${arc.sweep} ${digits(arc.end.x)} ${digits(arc.end.y)}`,
    );
  }
  parts.push("Z");
  return parts.join(" ");
}

function nudgeTowardCenter(id: RegionId, label: Pt, circles: readonly Circle[]): Pt {
  const owner: Partial<Record<RegionId, CircleId>> = {
    onlyA: "A",
    onlyB: "B",
    onlyC: "C",
  };
  const circle = circles.find((item) => item.id === owner[id]);
  if (!circle) return label;
  const dx = label.x - circle.cx;
  const dy = label.y - circle.cy;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: label.x - (dx / length) * 28,
    y: label.y - (dy / length) * 28,
  };
}

function outwardLabel(circle: Circle, circles: readonly Circle[]) {
  let dx = 0;
  let dy = 0;
  for (const other of circles) {
    if (other.id === circle.id) continue;
    dx += circle.cx - other.cx;
    dy += circle.cy - other.cy;
  }
  const length = Math.hypot(dx, dy) || 1;
  return {
    labelX: circle.cx + (dx / length) * circle.r * 0.8,
    labelY: circle.cy + (dy / length) * circle.r * 0.8,
  };
}

function outsideLabel(rect: Rect, circles: readonly Circle[]): Pt {
  const candidates = [
    { x: rect.x + rect.w - 48, y: rect.y + 36 },
    { x: rect.x + 48, y: rect.y + 36 },
    { x: rect.x + rect.w - 48, y: rect.y + rect.h - 28 },
    { x: rect.x + 48, y: rect.y + rect.h - 28 },
  ];
  const clear = candidates.find((point) =>
    circles.every((circle) => {
      const dx = point.x - circle.cx;
      const dy = point.y - circle.cy;
      return dx * dx + dy * dy > (circle.r + 28) * (circle.r + 28);
    }),
  );
  return clear ?? candidates[0];
}

function buildDiagram(sets: SetCount): Diagram {
  const layout = layoutFor(sets);
  const { circles } = layout;
  const pointsOn = new Map<CircleId, Pt[]>();
  for (const circle of circles) pointsOn.set(circle.id, []);

  for (let i = 0; i < circles.length; i += 1) {
    for (let j = i + 1; j < circles.length; j += 1) {
      const points = circleIntersections(circles[i], circles[j]);
      if (points.length !== 2) {
        throw new Error(`Expected two intersections for ${circles[i].id} and ${circles[j].id}`);
      }
      pointsOn.get(circles[i].id)?.push(...points);
      pointsOn.get(circles[j].id)?.push(...points);
    }
  }

  const directed: DirectedArc[] = [];
  for (const circle of circles) {
    const points = pointsOn.get(circle.id) ?? [];
    points.sort((left, right) => angleOf(circle, left) - angleOf(circle, right));
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      const a0 = angleOf(circle, start);
      let span = angleOf(circle, end) - a0;
      if (span <= 1e-8) span += TAU;
      const mid = a0 + span / 2;
      const inward = {
        x: circle.cx + (circle.r - 6) * Math.cos(mid),
        y: circle.cy + (circle.r - 6) * Math.sin(mid),
      };
      const outward = {
        x: circle.cx + (circle.r + 6) * Math.cos(mid),
        y: circle.cy + (circle.r + 6) * Math.sin(mid),
      };
      const large: 0 | 1 = span > Math.PI + 1e-8 ? 1 : 0;
      const base = {
        r: circle.r,
        cx: circle.cx,
        cy: circle.cy,
        large,
      };
      directed.push({
        ...base,
        region: regionAt(inward, circles, sets),
        start,
        end,
        startKey: pointKey(start),
        endKey: pointKey(end),
        a0,
        span,
        sweep: 1,
        sample: inward,
      });
      directed.push({
        ...base,
        region: regionAt(outward, circles, sets),
        start: end,
        end: start,
        startKey: pointKey(end),
        endKey: pointKey(start),
        a0: a0 + span,
        span: -span,
        sweep: 0,
        sample: outward,
      });
    }
  }

  const regions = regionsFor(sets)
    .filter((id) => id !== "outside")
    .map((id) => {
      const arcs = chainRegion(directed.filter((arc) => arc.region === id));
      const centroid = {
        x: arcs.reduce((sum, arc) => sum + arc.sample.x, 0) / arcs.length,
        y: arcs.reduce((sum, arc) => sum + arc.sample.y, 0) / arcs.length,
      };
      const label = nudgeTowardCenter(id, centroid, circles);
      return {
        id,
        d: pathFromArcs(arcs),
        labelX: label.x,
        labelY: label.y,
        arcs,
      };
    });

  const outside = outsideLabel(layout.rect, circles);

  return {
    sets,
    width: layout.width,
    height: layout.height,
    viewBox: `0 0 ${layout.width} ${layout.height}`,
    rect: layout.rect,
    outsideLabel: outside,
    circles: circles.map((circle) => ({ ...circle, ...outwardLabel(circle, circles) })),
    regions: [
      ...regions.map(({ id, d, labelX, labelY }) => ({ id, d, labelX, labelY })),
      {
        id: "outside",
        d: "",
        labelX: outside.x,
        labelY: outside.y,
      },
    ],
  };
}

export const DIAGRAM_2 = buildDiagram(2);
export const DIAGRAM_3 = buildDiagram(3);

export function diagramFor(sets: SetCount) {
  return sets === 2 ? DIAGRAM_2 : DIAGRAM_3;
}

function sampleArc(arc: DirectedArc, steps: number): Pt[] {
  const points: Pt[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = arc.a0 + arc.span * (index / steps);
    points.push({
      x: arc.cx + arc.r * Math.cos(angle),
      y: arc.cy + arc.r * Math.sin(angle),
    });
  }
  return points;
}

function pointInPolygon(point: Pt, polygon: readonly Pt[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const crosses = a.y > point.y !== b.y > point.y;
    if (!crosses) continue;
    const x = ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
    if (point.x < x) inside = !inside;
  }
  return inside;
}

function nearBoundary(point: Pt, circles: readonly Circle[], pad: number) {
  return circles.some((circle) => {
    const distance = Math.hypot(point.x - circle.cx, point.y - circle.cy);
    return Math.abs(distance - circle.r) < pad;
  });
}

const MAX_ELEMENTS = 16;
const TOKEN = /^[A-Za-z0-9]+$/;

export const NUMBER_ELEMENTS: ElementSets = {
  universe: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  A: ["1", "2", "3", "4"],
  B: ["2", "4", "6", "8"],
  C: ["3", "4", "5", "6"],
};

export const LETTER_ELEMENTS: ElementSets = {
  universe: ["a", "b", "c", "d", "e", "f", "g", "h"],
  A: ["a", "b", "c", "d"],
  B: ["b", "d", "f", "h"],
  C: ["c", "d", "e", "f"],
};

export const DE_MORGAN: readonly DeMorganPair[] = [
  {
    id: "complement-union",
    law: "(A ∪ B)′ = A′ ∩ B′",
    spoken: "The complement of A union B equals A complement intersect B complement.",
    why: "Outside both circles is exactly what is missing from A and missing from B.",
    left: {
      title: "(A ∪ B)′",
      spoken: "complement of A union B",
      builder: "{ x ∈ U | x ∉ A ∪ B }",
      builderSpoken: "the set of x in U such that x is not in A union B",
      regions: ["outside"],
    },
    right: {
      title: "A′ ∩ B′",
      spoken: "A complement intersect B complement",
      builder: "{ x ∈ U | x ∉ A and x ∉ B }",
      builderSpoken: "the set of x in U such that x is not in A and x is not in B",
      regions: ["outside"],
    },
  },
  {
    id: "complement-intersection",
    law: "(A ∩ B)′ = A′ ∪ B′",
    spoken: "The complement of A intersect B equals A complement union B complement.",
    why: "Everything except the overlap is what misses A or misses B.",
    left: {
      title: "(A ∩ B)′",
      spoken: "complement of A intersect B",
      builder: "{ x ∈ U | x ∉ A ∩ B }",
      builderSpoken: "the set of x in U such that x is not in A intersect B",
      regions: ["onlyA", "onlyB", "outside"],
    },
    right: {
      title: "A′ ∪ B′",
      spoken: "A complement union B complement",
      builder: "{ x ∈ U | x ∉ A or x ∉ B }",
      builderSpoken: "the set of x in U such that x is not in A or x is not in B",
      regions: ["onlyA", "onlyB", "outside"],
    },
  },
];

export function parseMembers(raw: string): string[] {
  const seen = new Set<string>();
  const members: string[] = [];
  for (const part of raw.split(/[,;\s{}]+/)) {
    const token = part.trim();
    if (!token || !TOKEN.test(token) || token.length > 12 || seen.has(token)) continue;
    seen.add(token);
    members.push(token);
    if (members.length >= MAX_ELEMENTS) break;
  }
  return members;
}

export function formatMembers(items: readonly string[]) {
  return items.join(", ");
}

export function memberDraftFrom(model: ElementSets): MemberDraft {
  return {
    U: formatMembers(model.universe),
    A: formatMembers(model.A),
    B: formatMembers(model.B),
    C: formatMembers(model.C),
  };
}

function orderedMembers(universe: readonly string[], members: readonly string[]) {
  const wanted = new Set(members);
  return universe.filter((item) => wanted.has(item));
}

function normalizeElements(model: ElementSets): ElementSets {
  const universe = parseMembers(formatMembers(model.universe));
  return {
    universe,
    A: orderedMembers(universe, model.A),
    B: orderedMembers(universe, model.B),
    C: orderedMembers(universe, model.C),
  };
}

export function withUniverse(model: ElementSets, raw: string): ElementSets {
  return normalizeElements({ ...model, universe: parseMembers(raw) });
}

export function withSet(model: ElementSets, which: "A" | "B" | "C", raw: string): ElementSets {
  const members = parseMembers(raw);
  const universe = [...model.universe];
  for (const member of members) {
    if (!universe.includes(member) && universe.length < MAX_ELEMENTS) universe.push(member);
  }
  return normalizeElements({ ...model, universe, [which]: members });
}

export function regionOf(model: ElementSets, element: string, sets: SetCount): RegionId {
  const inA = model.A.includes(element);
  const inB = model.B.includes(element);
  const inC = sets === 3 && model.C.includes(element);
  if (inA && inB && inC) return "abc";
  if (inA && inB) return "ab";
  if (inB && inC) return "bc";
  if (inC && inA) return "ca";
  if (inA) return "onlyA";
  if (inB) return "onlyB";
  if (inC) return "onlyC";
  return "outside";
}

export function elementsInRegion(model: ElementSets, region: RegionId, sets: SetCount) {
  return model.universe.filter((element) => regionOf(model, element, sets) === region);
}

export function elementsIn(model: ElementSets, regions: readonly RegionId[], sets: SetCount) {
  const wanted = new Set(regions);
  return model.universe.filter((element) => wanted.has(regionOf(model, element, sets)));
}

export function placeElement(
  model: ElementSets,
  element: string,
  region: RegionId,
  sets: SetCount,
): ElementSets {
  if (!model.universe.includes(element)) return model;
  const inA = region === "onlyA" || region === "ab" || region === "ca" || region === "abc";
  const inB = region === "onlyB" || region === "ab" || region === "bc" || region === "abc";
  const inC =
    sets === 3
      ? region === "onlyC" || region === "bc" || region === "ca" || region === "abc"
      : model.C.includes(element);
  const next = (list: readonly string[], include: boolean) => {
    const without = list.filter((item) => item !== element);
    return include ? [...without, element] : without;
  };
  return normalizeElements({
    universe: model.universe,
    A: next(model.A, inA),
    B: next(model.B, inB),
    C: next(model.C, inC),
  });
}

export function compareElements(left: string, right: string) {
  const leftNumber = /^(?:0|[1-9]\d*)$/.test(left);
  const rightNumber = /^(?:0|[1-9]\d*)$/.test(right);
  if (leftNumber && rightNumber) return Number(left) - Number(right);
  if (leftNumber) return -1;
  if (rightNumber) return 1;
  return left.localeCompare(right);
}

export function roster(elements: readonly string[]) {
  if (elements.length === 0) return "∅";
  return `{${[...elements].sort(compareElements).join(", ")}}`;
}

function spokenRoster(elements: readonly string[]) {
  if (elements.length === 0) return "the empty set";
  return `the set ${[...elements].sort(compareElements).join(", ")}`;
}

function leftSymbol(id: ExpressionId, sets: SetCount) {
  switch (id) {
    case "union":
    case "atLeastOne":
      return sets === 2 ? "A ∪ B" : "A ∪ B ∪ C";
    case "intersection":
    case "pairAB":
      return "A ∩ B";
    case "pairBC":
      return "B ∩ C";
    case "pairCA":
      return "C ∩ A";
    case "allThree":
      return "A ∩ B ∩ C";
    case "onlyA":
      return sets === 2 ? "A ∩ B′" : "A ∩ B′ ∩ C′";
    case "onlyB":
      return sets === 2 ? "B ∩ A′" : "B ∩ A′ ∩ C′";
    case "onlyC":
      return "C ∩ A′ ∩ B′";
    case "abOnly":
      return "A ∩ B ∩ C′";
    case "bcOnly":
      return "B ∩ C ∩ A′";
    case "caOnly":
      return "C ∩ A ∩ B′";
    case "symDiff":
      return "A Δ B";
    case "neither":
      return sets === 2 ? "(A ∪ B)′" : "(A ∪ B ∪ C)′";
    case "complementA":
      return "A′";
    case "complementB":
      return "B′";
    case "complementC":
      return "C′";
    case "exactlyOne":
      return "exactly one of A, B, C";
    case "exactlyTwo":
      return "exactly two of A, B, C";
    case "setA":
      return "A";
    case "setB":
      return "B";
    case "setC":
      return "C";
    case "universe":
      return "U";
    default: {
      const never: never = id;
      return never;
    }
  }
}

function builderFor(id: ExpressionId | null, sets: SetCount) {
  if (id === null) {
    return {
      builder: "{ x ∈ U | x is in the shaded region }",
      spoken: "the set of x in U such that x is in the shaded region",
    };
  }
  switch (id) {
    case "union":
      return {
        builder: "{ x ∈ U | x ∈ A or x ∈ B }",
        spoken: "the set of x in U such that x is in A or x is in B",
      };
    case "atLeastOne":
      return sets === 2
        ? {
            builder: "{ x ∈ U | x ∈ A or x ∈ B }",
            spoken: "the set of x in U such that x is in A or x is in B",
          }
        : {
            builder: "{ x ∈ U | x ∈ A or x ∈ B or x ∈ C }",
            spoken: "the set of x in U such that x is in A or x is in B or x is in C",
          };
    case "intersection":
    case "pairAB":
      return {
        builder: "{ x ∈ U | x ∈ A and x ∈ B }",
        spoken: "the set of x in U such that x is in A and x is in B",
      };
    case "pairBC":
      return {
        builder: "{ x ∈ U | x ∈ B and x ∈ C }",
        spoken: "the set of x in U such that x is in B and x is in C",
      };
    case "pairCA":
      return {
        builder: "{ x ∈ U | x ∈ C and x ∈ A }",
        spoken: "the set of x in U such that x is in C and x is in A",
      };
    case "allThree":
      return {
        builder: "{ x ∈ U | x ∈ A and x ∈ B and x ∈ C }",
        spoken: "the set of x in U such that x is in A and x is in B and x is in C",
      };
    case "onlyA":
      return sets === 2
        ? {
            builder: "{ x ∈ U | x ∈ A and x ∉ B }",
            spoken: "the set of x in U such that x is in A and x is not in B",
          }
        : {
            builder: "{ x ∈ U | x ∈ A and x ∉ B and x ∉ C }",
            spoken: "the set of x in U such that x is in A and x is not in B and x is not in C",
          };
    case "onlyB":
      return sets === 2
        ? {
            builder: "{ x ∈ U | x ∈ B and x ∉ A }",
            spoken: "the set of x in U such that x is in B and x is not in A",
          }
        : {
            builder: "{ x ∈ U | x ∈ B and x ∉ A and x ∉ C }",
            spoken: "the set of x in U such that x is in B and x is not in A and x is not in C",
          };
    case "onlyC":
      return {
        builder: "{ x ∈ U | x ∈ C and x ∉ A and x ∉ B }",
        spoken: "the set of x in U such that x is in C and x is not in A and x is not in B",
      };
    case "abOnly":
      return {
        builder: "{ x ∈ U | x ∈ A and x ∈ B and x ∉ C }",
        spoken: "the set of x in U such that x is in A and x is in B and x is not in C",
      };
    case "bcOnly":
      return {
        builder: "{ x ∈ U | x ∈ B and x ∈ C and x ∉ A }",
        spoken: "the set of x in U such that x is in B and x is in C and x is not in A",
      };
    case "caOnly":
      return {
        builder: "{ x ∈ U | x ∈ C and x ∈ A and x ∉ B }",
        spoken: "the set of x in U such that x is in C and x is in A and x is not in B",
      };
    case "symDiff":
      return {
        builder: "{ x ∈ U | x is in A or B, but not both }",
        spoken: "the set of x in U such that x is in A or B, but not both",
      };
    case "neither":
      return sets === 2
        ? {
            builder: "{ x ∈ U | x ∉ A and x ∉ B }",
            spoken: "the set of x in U such that x is not in A and x is not in B",
          }
        : {
            builder: "{ x ∈ U | x ∉ A and x ∉ B and x ∉ C }",
            spoken: "the set of x in U such that x is not in A and x is not in B and x is not in C",
          };
    case "complementA":
      return {
        builder: "{ x ∈ U | x ∉ A }",
        spoken: "the set of x in U such that x is not in A",
      };
    case "complementB":
      return {
        builder: "{ x ∈ U | x ∉ B }",
        spoken: "the set of x in U such that x is not in B",
      };
    case "complementC":
      return {
        builder: "{ x ∈ U | x ∉ C }",
        spoken: "the set of x in U such that x is not in C",
      };
    case "exactlyOne":
      return {
        builder: "{ x ∈ U | x is in exactly one of A, B, and C }",
        spoken: "the set of x in U such that x is in exactly one of A, B, and C",
      };
    case "exactlyTwo":
      return {
        builder: "{ x ∈ U | x is in exactly two of A, B, and C }",
        spoken: "the set of x in U such that x is in exactly two of A, B, and C",
      };
    case "setA":
      return {
        builder: "{ x ∈ U | x ∈ A }",
        spoken: "the set of x in U such that x is in A",
      };
    case "setB":
      return {
        builder: "{ x ∈ U | x ∈ B }",
        spoken: "the set of x in U such that x is in B",
      };
    case "setC":
      return {
        builder: "{ x ∈ U | x ∈ C }",
        spoken: "the set of x in U such that x is in C",
      };
    case "universe":
      return {
        builder: "{ x | x ∈ U }",
        spoken: "the set of x such that x is in U",
      };
    default: {
      const never: never = id;
      return never;
    }
  }
}

export function elementReading(
  id: ExpressionId | null,
  model: ElementSets,
  sets: SetCount,
  shaded: readonly RegionId[],
): ElementReading {
  const regions = id ? regionsOf(id, sets) : shaded;
  const elements = elementsIn(model, regions, sets);
  const listed = roster(elements);
  const left = id ? leftSymbol(id, sets) : "Shaded";
  const built = builderFor(id, sets);
  const title = id ? patternFor(id, sets).title : elements.length === 0 ? "Nothing shaded" : "Custom shading";
  return {
    title,
    left,
    roster: listed,
    equation: `${left} = ${listed}`,
    builder: built.builder,
    spoken: `${title}. ${left} equals ${spokenRoster(elements)}. ${built.spoken}.`,
    elements,
  };
}

export function deMorganValue(model: ElementSets, regions: readonly RegionId[]) {
  return roster(elementsIn(model, regions, 2));
}

export function deMorganCount(counts: Counts, regions: readonly RegionId[], sets: SetCount) {
  const two =
    sets === 2
      ? counts
      : {
          ...ZERO_COUNTS,
          onlyA: counts.onlyA + counts.ca,
          onlyB: counts.onlyB + counts.bc,
          ab: counts.ab + counts.abc,
          outside: counts.outside + counts.onlyC,
        };
  return sumRegions(two, regions);
}

export function auditVennDiagram() {
  const signatures = new Map<string, string>();
  for (const pattern of PATTERNS) {
    const key = `${pattern.sets}:${signature(pattern.regions)}`;
    const previous = signatures.get(key);
    if (previous) throw new Error(`Duplicate shading ${key}: ${previous} and ${pattern.id}`);
    signatures.set(key, pattern.id);
  }

  for (const sets of [2, 3] as const) {
    const counts = defaultCounts(sets);
    const choices = expressionChoices(sets);
    for (const choice of choices) {
      const regions = regionsOf(choice.id, sets);
      const matched = matchExpression(regions, sets);
      if (matched !== choice.id) {
        throw new Error(`${choice.id} matched ${matched}`);
      }
      const model = formulaFor(choice.id, counts, sets, regions);
      const shadedSum = sumRegions(counts, regions);
      if (model.total !== shadedSum) {
        throw new Error(
          `${choice.id} formula ${model.total} does not match shaded sum ${shadedSum}`,
        );
      }
      for (const item of model.steps) {
        if (evalTerms(item.terms) !== item.total) {
          throw new Error(`${choice.id} step ${item.left} does not add up`);
        }
      }
    }

    if (sets === 3) {
      const totals = derive(counts, 3);
      const posterOnlyA = totals.nA - totals.nAB + totals.nCA + totals.nABC;
      const correctOnlyA = totals.nA - totals.nAB - totals.nCA + totals.nABC;
      if (posterOnlyA === correctOnlyA || correctOnlyA !== counts.onlyA) {
        throw new Error("Only A formula did not correct the poster sign");
      }
    }
  }

  for (const problem of WORD_PROBLEMS) {
    for (const id of regionsFor(problem.sets)) {
      if (problem.solution[id] < 0) throw new Error(`${problem.id} has a negative ${id}`);
    }
    const totals = derive(problem.solution, problem.sets);
    if (problem.sets === 2 && problem.id === "soccer-chess") {
      if (totals.nA !== 18 || totals.nB !== 15 || totals.nAB !== 8 || totals.nU !== 30) {
        throw new Error("Soccer and chess solution does not match the totals");
      }
    }
    if (problem.id === "soccer-chess-music") {
      if (
        totals.nA !== 20 ||
        totals.nB !== 16 ||
        totals.nC !== 18 ||
        totals.nAB !== 8 ||
        totals.nBC !== 7 ||
        totals.nCA !== 9 ||
        totals.nABC !== 4 ||
        totals.nU !== 40
      ) {
        throw new Error("Soccer, chess, and music solution does not match the totals");
      }
    }
    const grade = gradeProblem(problem, draftFromSolution(problem));
    if (!grade.correct) throw new Error(`${problem.id} does not grade its own solution`);
  }

  const numbers = NUMBER_ELEMENTS;
  const unionReading = elementReading("union", numbers, 2, regionsOf("union", 2));
  if (unionReading.equation !== "A ∪ B = {1, 2, 3, 4, 6, 8}") {
    throw new Error(`Union roster was ${unionReading.equation}`);
  }
  if (unionReading.builder !== "{ x ∈ U | x ∈ A or x ∈ B }") {
    throw new Error(`Union builder was ${unionReading.builder}`);
  }
  const exactlyOne = elementReading("exactlyOne", numbers, 3, regionsOf("exactlyOne", 3));
  if (exactlyOne.roster !== "{1, 5, 8}") {
    throw new Error(`Exactly one roster was ${exactlyOne.roster}`);
  }
  const letters = elementReading("union", LETTER_ELEMENTS, 2, regionsOf("union", 2));
  if (letters.roster !== "{a, b, c, d, f, h}") {
    throw new Error(`Letter union was ${letters.roster}`);
  }
  for (const pair of DE_MORGAN) {
    if (signature(pair.left.regions) !== signature(pair.right.regions)) {
      throw new Error(`${pair.law} shades different regions`);
    }
    const left = deMorganValue(numbers, pair.left.regions);
    const right = deMorganValue(numbers, pair.right.regions);
    if (left !== right) throw new Error(`${pair.law} rosters differ: ${left} vs ${right}`);
    const leftCount = deMorganCount(DEFAULT_COUNTS_2, pair.left.regions, 2);
    const rightCount = deMorganCount(DEFAULT_COUNTS_2, pair.right.regions, 2);
    if (leftCount !== rightCount) throw new Error(`${pair.law} counts differ`);
  }
  if (deMorganValue(numbers, ["outside"]) !== "{5, 7, 9, 10}") {
    throw new Error("Complement of the union roster is wrong");
  }
  if (deMorganValue(numbers, ["onlyA", "onlyB", "outside"]) !== "{1, 3, 5, 6, 7, 8, 9, 10}") {
    throw new Error("Complement of the intersection roster is wrong");
  }
  if (deMorganCount(DEFAULT_COUNTS_2, ["outside"], 2) !== 5) {
    throw new Error("De Morgan complement-union count is wrong");
  }
  if (deMorganCount(DEFAULT_COUNTS_2, ["onlyA", "onlyB", "outside"], 2) !== 40) {
    throw new Error("De Morgan complement-intersection count is wrong");
  }
  const moved = placeElement(numbers, "2", "onlyA", 2);
  if (regionOf(moved, "2", 2) !== "onlyA" || moved.B.includes("2") || !moved.A.includes("2")) {
    throw new Error("Moving 2 to only A did not update membership");
  }
  const edited = withSet(numbers, "A", "1, 2, 9");
  if (roster(edited.A) !== "{1, 2, 9}" || !edited.universe.includes("9")) {
    throw new Error("Editing set A did not keep the universe in sync");
  }

  for (const sets of [2, 3] as const) {
    const diagram = diagramFor(sets);
    const layout = layoutFor(sets);
    const polygons = new Map<RegionId, Pt[]>();
    const rebuilt = rebuildPolygons(sets);
    for (const [id, polygon] of rebuilt) polygons.set(id, polygon);
    const labels = new Map(diagram.regions.map((region) => [region.id, region]));
    for (const id of regionsFor(sets)) {
      if (id === "outside") continue;
      const label = labels.get(id);
      const polygon = polygons.get(id);
      if (!label || !polygon) throw new Error(`Missing geometry for ${id}`);
      if (!pointInPolygon({ x: label.labelX, y: label.labelY }, polygon)) {
        throw new Error(`Label for ${sets}-set ${id} is outside its region`);
      }
    }
    const step = 8;
    for (let y = layout.rect.y + 4; y < layout.rect.y + layout.rect.h; y += step) {
      for (let x = layout.rect.x + 4; x < layout.rect.x + layout.rect.w; x += step) {
        const point = { x, y };
        if (nearBoundary(point, layout.circles, 5)) continue;
        const expected = regionAt(point, layout.circles, sets);
        const hits = [...polygons.entries()].filter(([, polygon]) => pointInPolygon(point, polygon));
        if (expected === "outside") {
          if (hits.length !== 0) {
            throw new Error(`${sets}-set outside point ${x},${y} hit ${hits.map(([id]) => id).join(",")}`);
          }
        } else if (hits.length !== 1 || hits[0][0] !== expected) {
          throw new Error(
            `${sets}-set point ${x},${y} expected ${expected} but hit ${hits.map(([id]) => id).join(",") || "nothing"}`,
          );
        }
      }
    }
  }
}

function rebuildPolygons(sets: SetCount) {
  const layout = layoutFor(sets);
  const { circles } = layout;
  const pointsOn = new Map<CircleId, Pt[]>();
  for (const circle of circles) pointsOn.set(circle.id, []);
  for (let i = 0; i < circles.length; i += 1) {
    for (let j = i + 1; j < circles.length; j += 1) {
      const points = circleIntersections(circles[i], circles[j]);
      pointsOn.get(circles[i].id)?.push(...points);
      pointsOn.get(circles[j].id)?.push(...points);
    }
  }
  const directed: DirectedArc[] = [];
  for (const circle of circles) {
    const points = pointsOn.get(circle.id) ?? [];
    points.sort((left, right) => angleOf(circle, left) - angleOf(circle, right));
    for (let index = 0; index < points.length; index += 1) {
      const start = points[index];
      const end = points[(index + 1) % points.length];
      const a0 = angleOf(circle, start);
      let span = angleOf(circle, end) - a0;
      if (span <= 1e-8) span += TAU;
      const mid = a0 + span / 2;
      const inward = {
        x: circle.cx + (circle.r - 6) * Math.cos(mid),
        y: circle.cy + (circle.r - 6) * Math.sin(mid),
      };
      const outward = {
        x: circle.cx + (circle.r + 6) * Math.cos(mid),
        y: circle.cy + (circle.r + 6) * Math.sin(mid),
      };
      const large: 0 | 1 = span > Math.PI + 1e-8 ? 1 : 0;
      directed.push({
        region: regionAt(inward, circles, sets),
        start,
        end,
        startKey: pointKey(start),
        endKey: pointKey(end),
        r: circle.r,
        cx: circle.cx,
        cy: circle.cy,
        a0,
        span,
        large,
        sweep: 1,
        sample: inward,
      });
      directed.push({
        region: regionAt(outward, circles, sets),
        start: end,
        end: start,
        startKey: pointKey(end),
        endKey: pointKey(start),
        r: circle.r,
        cx: circle.cx,
        cy: circle.cy,
        a0: a0 + span,
        span: -span,
        large,
        sweep: 0,
        sample: outward,
      });
    }
  }
  const polygons = new Map<RegionId, Pt[]>();
  for (const id of regionsFor(sets)) {
    if (id === "outside") continue;
    const arcs = chainRegion(directed.filter((arc) => arc.region === id));
    const polygon = arcs.flatMap((arc) => sampleArc(arc, 24).slice(0, -1));
    polygons.set(id, polygon);
  }
  return polygons;
}
