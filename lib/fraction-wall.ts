export type FractionPick = {
  /** How many unit bricks are shaded, counting from the left. */
  count: number;
  denominator: number;
};

export type SpeechOptions = {
  decimals: boolean;
  percents: boolean;
};

export type ChallengeStatus = "empty" | "match" | "same-row" | "short" | "long";

const ONES = [
  "",
  "whole",
  "half",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
] as const;

const MANY = [
  "",
  "wholes",
  "halves",
  "thirds",
  "fourths",
  "fifths",
  "sixths",
  "sevenths",
  "eighths",
  "ninths",
  "tenths",
  "elevenths",
  "twelfths",
] as const;

export const WALL_STOPS = [6, 8, 10, 12] as const;

export const CHALLENGE_TARGETS: readonly FractionPick[] = [
  { count: 1, denominator: 2 },
  { count: 1, denominator: 3 },
  { count: 2, denominator: 3 },
  { count: 1, denominator: 4 },
  { count: 3, denominator: 4 },
  { count: 1, denominator: 5 },
  { count: 2, denominator: 5 },
  { count: 3, denominator: 5 },
  { count: 4, denominator: 5 },
  { count: 1, denominator: 6 },
  { count: 5, denominator: 6 },
];

export function gcd(a: number, b: number) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

export function simplify(numerator: number, denominator: number) {
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

export function fractionsEqual(
  aCount: number,
  aDen: number,
  bCount: number,
  bDen: number,
) {
  return aCount * bDen === aDen * bCount;
}

/** Positive when A is larger, negative when B is larger. */
export function comparePicks(a: FractionPick, b: FractionPick): -1 | 0 | 1 {
  const left = a.count * b.denominator;
  const right = b.count * a.denominator;
  if (left === right) return 0;
  return left > right ? 1 : -1;
}

function trimFixed(value: string) {
  return value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatDecimal(numerator: number, denominator: number) {
  if (denominator === 0) return "";
  const value = numerator / denominator;
  if (Number.isInteger(value)) return String(value);
  const reduced = simplify(numerator, denominator).denominator;
  let factor = reduced;
  while (factor % 2 === 0) factor /= 2;
  while (factor % 5 === 0) factor /= 5;
  if (factor === 1) return trimFixed(value.toFixed(6));
  return `${trimFixed(value.toFixed(3))}…`;
}

export function formatPercent(numerator: number, denominator: number) {
  const rounded = Math.round((numerator / denominator) * 1000) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${text}%`;
}

export function speakCount(count: number, denominator: number) {
  if (denominator <= 1) return "1 whole";
  const word = count === 1 ? ONES[denominator] : MANY[denominator];
  return `${count} ${word ?? "parts"}`;
}

export function rowName(denominator: number) {
  if (denominator <= 1) return "wholes";
  return MANY[denominator] ?? "parts";
}

export function hasAlternate(target: FractionPick, maxDen: number) {
  for (let denominator = 2; denominator <= maxDen; denominator += 1) {
    if (denominator === target.denominator) continue;
    if ((target.count * denominator) % target.denominator !== 0) continue;
    const count = (target.count * denominator) / target.denominator;
    if (count >= 1 && count < denominator) return true;
  }
  return false;
}

export function targetsFor(maxDen: number) {
  return CHALLENGE_TARGETS.filter((target) => hasAlternate(target, maxDen));
}

export function challengeStatus(
  pick: FractionPick | null,
  target: FractionPick,
): ChallengeStatus {
  if (!pick || pick.count <= 0) return "empty";
  if (!fractionsEqual(pick.count, pick.denominator, target.count, target.denominator)) {
    return comparePicks(pick, target) < 0 ? "short" : "long";
  }
  if (pick.denominator === target.denominator && pick.count === target.count) {
    return "same-row";
  }
  return "match";
}

export function samePick(pick: FractionPick | null, denominator: number, count: number) {
  return pick !== null && pick.denominator === denominator && pick.count === count;
}

function details(count: number, denominator: number, options: SpeechOptions) {
  const parts = [speakCount(count, denominator)];
  if (options.decimals) parts.push(formatDecimal(count, denominator));
  if (options.percents) {
    parts.push(formatPercent(count, denominator).replace("%", " percent"));
  }
  return parts.join(", ");
}

export function describeExplore(
  focus: FractionPick | null,
  rows: readonly FractionPick[],
  showEquivalents: boolean,
  options: SpeechOptions,
) {
  if (!focus || focus.count <= 0) {
    return "Nothing selected. Tap a brick to shade that fraction from the left of its row.";
  }
  let sentence = `${details(focus.count, focus.denominator, options)}.`;
  const reduced = simplify(focus.count, focus.denominator);
  const matches = showEquivalents
    ? rows.filter(
        (row) =>
          row.denominator !== focus.denominator &&
          row.count > 0 &&
          fractionsEqual(row.count, row.denominator, focus.count, focus.denominator),
      )
    : [];
  const alreadyLowest =
    reduced.numerator === focus.count && reduced.denominator === focus.denominator;
  if (!alreadyLowest && matches.length === 0) {
    sentence += ` That equals ${speakCount(reduced.numerator, reduced.denominator)}.`;
  }
  if (matches.length > 0) {
    const named = matches
      .map((row) => speakCount(row.count, row.denominator))
      .join(" and ");
    sentence += ` Same length as ${named}.`;
  }
  const others = rows.filter(
    (row) =>
      row.denominator !== focus.denominator &&
      row.count > 0 &&
      !matches.some((match) => match.denominator === row.denominator),
  );
  if (others.length > 0) {
    const named = others
      .map((row) => speakCount(row.count, row.denominator))
      .join(" and ");
    sentence += ` Also selected: ${named}.`;
  }
  return sentence;
}

export function describeCompare(
  sideA: FractionPick | null,
  sideB: FractionPick | null,
  slot: "a" | "b",
  options: SpeechOptions,
) {
  if (!sideA && !sideB) {
    return "Choose fraction A or B, then tap a brick. Shading grows from the left.";
  }
  const aText = sideA
    ? `Fraction A is ${details(sideA.count, sideA.denominator, options)}.`
    : "Fraction A is empty.";
  const bText = sideB
    ? `Fraction B is ${details(sideB.count, sideB.denominator, options)}.`
    : "Fraction B is empty.";
  let verdict = "";
  if (sideA && sideB) {
    const compared = comparePicks(sideA, sideB);
    if (compared === 0) verdict = " They are equal.";
    else if (compared > 0) verdict = " Fraction A is larger.";
    else verdict = " Fraction B is larger.";
  } else {
    verdict = slot === "a" ? " Choosing fraction A." : " Choosing fraction B.";
  }
  return `${aText} ${bText}${verdict}`;
}

export function describeChallenge(
  pick: FractionPick | null,
  target: FractionPick,
  options: SpeechOptions,
) {
  const status = challengeStatus(pick, target);
  const targetSpoken = speakCount(target.count, target.denominator);
  if (status === "empty" || !pick) {
    return `Show ${targetSpoken} another way. Tap a brick on a different row so the shaded length matches the target.`;
  }
  const selected = details(pick.count, pick.denominator, options);
  if (status === "match") {
    return `${selected}. Matched. This is another way to show ${targetSpoken}.`;
  }
  if (status === "same-row") {
    return `${selected}. That's the target row. Try a different denominator.`;
  }
  if (status === "short") {
    return `${selected}. Shorter than ${targetSpoken}.`;
  }
  return `${selected}. Longer than ${targetSpoken}.`;
}

export function pickKey(pick: FractionPick) {
  return `${pick.count}/${pick.denominator}`;
}
