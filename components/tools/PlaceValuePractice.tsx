"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

type Mode = "practice" | "timed" | "streak";
type Phase = "setup" | "playing" | "results";
type Difficulty = "easy" | "medium" | "challenge";
type CompareOp = "<" | "=" | ">";
type PlaceId =
  | "ones"
  | "tens"
  | "hundreds"
  | "thousands"
  | "tenThousands"
  | "hundredThousands"
  | "millions"
  | "tenths"
  | "hundredths"
  | "thousandths";

type PlaceProblem = {
  kind: "place";
  digits: string;
  decimalPlaces: number;
  highlightIndex: number;
  place: PlaceId;
};

type ValueProblem = {
  kind: "value";
  digits: string;
  decimalPlaces: number;
  highlightIndex: number;
  place: PlaceId;
  digit: number;
};

type ExpandedProblem = {
  kind: "expanded";
  digits: string;
  decimalPlaces: 0;
};

type CompareProblem = {
  kind: "compare";
  left: string;
  right: string;
  answer: CompareOp;
};

type RoundProblem = {
  kind: "round";
  digits: string;
  decimalPlaces: number;
  place: PlaceId;
  expectedThousandths: number;
};

type Problem =
  | PlaceProblem
  | ValueProblem
  | ExpandedProblem
  | CompareProblem
  | RoundProblem;

type PlaceRecord = { problem: Problem; ms: number; correct: boolean };

const TIMED_SECONDS = 60;
const SLOW_MS = 4000;
const TOOL_SLUG = "place-value";
const MAX_INPUT = 40;

const DIGIT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

const TENS_WORDS = [
  "zero",
  "ten",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
] as const;

const PLACE_META: Record<
  PlaceId,
  {
    label: string;
    singular: string;
    power: number;
    aliases: string[];
  }
> = {
  ones: {
    label: "ones",
    singular: "one",
    power: 0,
    aliases: ["ones", "one", "units", "unit", "1s"],
  },
  tens: {
    label: "tens",
    singular: "ten",
    power: 1,
    aliases: ["tens", "ten", "10s"],
  },
  hundreds: {
    label: "hundreds",
    singular: "hundred",
    power: 2,
    aliases: ["hundreds", "hundred", "100s"],
  },
  thousands: {
    label: "thousands",
    singular: "thousand",
    power: 3,
    aliases: ["thousands", "thousand", "1000s", "1,000s"],
  },
  tenThousands: {
    label: "ten thousands",
    singular: "ten thousand",
    power: 4,
    aliases: [
      "ten thousands",
      "ten thousand",
      "10 thousands",
      "10 thousand",
      "10000s",
      "10,000s",
    ],
  },
  hundredThousands: {
    label: "hundred thousands",
    singular: "hundred thousand",
    power: 5,
    aliases: [
      "hundred thousands",
      "hundred thousand",
      "100 thousands",
      "100 thousand",
      "100000s",
      "100,000s",
    ],
  },
  millions: {
    label: "millions",
    singular: "million",
    power: 6,
    aliases: ["millions", "million", "1000000s", "1,000,000s"],
  },
  tenths: {
    label: "tenths",
    singular: "tenth",
    power: -1,
    aliases: ["tenths", "tenth"],
  },
  hundredths: {
    label: "hundredths",
    singular: "hundredth",
    power: -2,
    aliases: ["hundredths", "hundredth"],
  },
  thousandths: {
    label: "thousandths",
    singular: "thousandth",
    power: -3,
    aliases: ["thousandths", "thousandth"],
  },
};

const EASY_PLACES: PlaceId[] = ["ones", "tens", "hundreds"];

const DIFFICULTIES: {
  id: Difficulty;
  title: string;
  detail: string;
}[] = [
  {
    id: "easy",
    title: "Easy",
    detail: "Ones, tens, and hundreds — name the place or the value.",
  },
  {
    id: "medium",
    title: "Medium",
    detail: "Through hundred thousands, expanded form, and compare.",
  },
  {
    id: "challenge",
    title: "Challenge",
    detail: "Decimals to thousandths, plus rounding to a named place.",
  },
];

const CHART_COLUMNS: {
  label: string;
  digit: string;
  value: string;
  point?: boolean;
}[] = [
  { label: "Hundred thousands", digit: "2", value: "200,000" },
  { label: "Ten thousands", digit: "4", value: "40,000" },
  { label: "Thousands", digit: "7", value: "7,000" },
  { label: "Hundreds", digit: "3", value: "300" },
  { label: "Tens", digit: "6", value: "60" },
  { label: "Ones", digit: "5", value: "5" },
  { label: "", digit: ".", value: "", point: true },
  { label: "Tenths", digit: "8", value: "0.8" },
  { label: "Hundredths", digit: "2", value: "0.02" },
];

function pickFrom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function placeFromPower(power: number): PlaceId | null {
  const found = (Object.keys(PLACE_META) as PlaceId[]).find(
    (id) => PLACE_META[id].power === power,
  );
  return found ?? null;
}

function powerAtIndex(digits: string, decimalPlaces: number, index: number) {
  return digits.length - 1 - index - decimalPlaces;
}

function placeAtIndex(
  digits: string,
  decimalPlaces: number,
  index: number,
): PlaceId {
  const place = placeFromPower(powerAtIndex(digits, decimalPlaces, index));
  return place ?? "ones";
}

function randomDigits(length: number) {
  let next = String(randomInt(1, 9));
  for (let i = 1; i < length; i += 1) {
    next += String(randomInt(0, 9));
  }
  return next;
}

function addCommas(whole: string) {
  const chars: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < whole.length; i += 1) {
    const remaining = whole.length - i;
    if (i > 0 && remaining % 3 === 0) chars.push(",");
    map.push(chars.length);
    chars.push(whole[i] ?? "0");
  }
  return { text: chars.join(""), map };
}

function formatDigits(digits: string, decimalPlaces: number) {
  const wholeLen = Math.max(digits.length - decimalPlaces, 0);
  const whole = digits.slice(0, wholeLen) || "0";
  const { text } = addCommas(whole);
  if (decimalPlaces === 0) return text;
  return `${text}.${digits.slice(wholeLen)}`;
}

function displayIndexOfDigit(
  digits: string,
  decimalPlaces: number,
  digitIndex: number,
) {
  const wholeLen = Math.max(digits.length - decimalPlaces, 0);
  const whole = digits.slice(0, wholeLen) || "0";
  const { text, map } = addCommas(whole);
  if (digitIndex < wholeLen) return map[digitIndex] ?? 0;
  return text.length + 1 + (digitIndex - wholeLen);
}

function withCommas(value: number) {
  const abs = Math.abs(Math.trunc(value));
  const { text } = addCommas(String(abs));
  return value < 0 ? `-${text}` : text;
}

function formatExpanded(digits: string) {
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits[i]);
    if (digit === 0) continue;
    const power = digits.length - 1 - i;
    parts.push(withCommas(digit * 10 ** power));
  }
  return parts.join(" + ") || "0";
}

function digitsToThousandths(digits: string, decimalPlaces: number) {
  const wholeLen = Math.max(digits.length - decimalPlaces, 0);
  const whole = digits.slice(0, wholeLen) || "0";
  let frac = digits.slice(wholeLen);
  while (frac.length < 3) frac += "0";
  return Number(`${whole}${frac.slice(0, 3)}`);
}

function roundThousandths(thousandths: number, power: number) {
  const unit = 10 ** (power + 3);
  return Math.round(thousandths / unit) * unit;
}

function formatThousandths(thousandths: number, decimals: number) {
  const sign = thousandths < 0 ? "-" : "";
  const abs = Math.abs(thousandths);
  const whole = Math.floor(abs / 1000);
  const frac = String(abs % 1000).padStart(3, "0");
  if (decimals <= 0) return `${sign}${withCommas(whole)}`;
  return `${sign}${withCommas(whole)}.${frac.slice(0, decimals)}`;
}

function pickHighlightIndex(digits: string, preferNonZero: boolean) {
  const indices = digits.split("").map((_, index) => index);
  const nonzero = indices.filter((index) => digits[index] !== "0");
  const pool = preferNonZero && nonzero.length > 0 ? nonzero : indices;
  return pickFrom(pool);
}

function makeWhole(minLen: number, maxLen: number) {
  return randomDigits(randomInt(minLen, maxLen));
}

function makeDecimal() {
  const decimalPlaces = randomInt(1, 3) as 1 | 2 | 3;
  const whole =
    Math.random() < 0.2 ? "0" : randomDigits(randomInt(1, 3));
  let frac = "";
  for (let i = 0; i < decimalPlaces; i += 1) {
    frac += String(randomInt(i === decimalPlaces - 1 ? 1 : 0, 9));
  }
  return { digits: `${whole}${frac}`, decimalPlaces };
}

function makePlaceValue(
  digits: string,
  decimalPlaces: number,
  kind: "place" | "value",
): PlaceProblem | ValueProblem {
  const highlightIndex = pickHighlightIndex(digits, kind === "value");
  const place = placeAtIndex(digits, decimalPlaces, highlightIndex);
  if (kind === "place") {
    return { kind, digits, decimalPlaces, highlightIndex, place };
  }
  return {
    kind,
    digits,
    decimalPlaces,
    highlightIndex,
    place,
    digit: Number(digits[highlightIndex]),
  };
}

function makeExpanded(): ExpandedProblem {
  return { kind: "expanded", digits: makeWhole(4, 6), decimalPlaces: 0 };
}

function makeCompare(): CompareProblem {
  const len = randomInt(3, 6);
  const left = randomDigits(len);
  if (Math.random() < 0.16) {
    return { kind: "compare", left, right: left, answer: "=" };
  }
  let right = randomDigits(len);
  for (let i = 0; i < 8 && right === left; i += 1) {
    right = randomDigits(len);
  }
  const answer: CompareOp =
    Number(left) === Number(right) ? "=" : Number(left) < Number(right) ? "<" : ">";
  return { kind: "compare", left, right, answer };
}

function makeRound(): RoundProblem {
  const place = pickFrom([
    "tens",
    "hundreds",
    "ones",
    "tenths",
    "hundredths",
  ] as const);
  const power = PLACE_META[place].power;

  if (power >= 1) {
    const digits = randomDigits(randomInt(power + 1, power + 3));
    return {
      kind: "round",
      digits,
      decimalPlaces: 0,
      place,
      expectedThousandths: roundThousandths(
        digitsToThousandths(digits, 0),
        power,
      ),
    };
  }

  if (power === 0) {
    const { digits, decimalPlaces } = makeDecimal();
    return {
      kind: "round",
      digits,
      decimalPlaces,
      place,
      expectedThousandths: roundThousandths(
        digitsToThousandths(digits, decimalPlaces),
        0,
      ),
    };
  }

  const neededDecimals = Math.max(2, -power + 1);
  const decimalPlaces = Math.min(3, neededDecimals) as 2 | 3;
  const whole = randomDigits(randomInt(1, 3));
  let frac = "";
  for (let i = 0; i < decimalPlaces; i += 1) {
    frac += String(randomInt(i === decimalPlaces - 1 ? 1 : 0, 9));
  }
  const digits = `${whole}${frac}`;
  return {
    kind: "round",
    digits,
    decimalPlaces,
    place,
    expectedThousandths: roundThousandths(
      digitsToThousandths(digits, decimalPlaces),
      power,
    ),
  };
}

function generateProblem(difficulty: Difficulty): Problem {
  if (difficulty === "easy") {
    const digits = makeWhole(2, 3);
    return makePlaceValue(digits, 0, Math.random() < 0.55 ? "place" : "value");
  }

  if (difficulty === "medium") {
    const roll = Math.random();
    if (roll < 0.28) return makeExpanded();
    if (roll < 0.5) return makeCompare();
    const useMillions = Math.random() < 0.18;
    const digits = useMillions ? makeWhole(7, 7) : makeWhole(4, 6);
    return makePlaceValue(digits, 0, roll < 0.75 ? "place" : "value");
  }

  const roll = Math.random();
  if (roll < 0.38) return makeRound();
  const { digits, decimalPlaces } = makeDecimal();
  return makePlaceValue(digits, decimalPlaces, roll < 0.7 ? "place" : "value");
}

function problemKey(problem: Problem) {
  switch (problem.kind) {
    case "place":
      return `place:${problem.digits}.${problem.decimalPlaces}:${problem.highlightIndex}`;
    case "value":
      return `value:${problem.digits}.${problem.decimalPlaces}:${problem.highlightIndex}`;
    case "expanded":
      return `expanded:${problem.digits}`;
    case "compare":
      return `compare:${problem.left}${problem.answer}${problem.right}`;
    case "round":
      return `round:${problem.digits}.${problem.decimalPlaces}:${problem.place}`;
  }
}

function sameProblem(left: Problem, right: Problem) {
  return problemKey(left) === problemKey(right);
}

function uniqueProblems(problems: Problem[]) {
  const seen = new Set<string>();
  return problems.filter((problem) => {
    const key = problemKey(problem);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function nextProblem(
  difficulty: Difficulty,
  last: Problem | null,
  focus?: Problem[],
): Problem {
  const pool = focus && focus.length > 0 ? focus : null;
  if (pool) {
    let pick = pickFrom(pool);
    for (let i = 0; i < 8 && last && pool.length > 1; i += 1) {
      if (!sameProblem(pick, last)) break;
      pick = pickFrom(pool);
    }
    return pick;
  }

  let pick = generateProblem(difficulty);
  for (let i = 0; i < 10 && last; i += 1) {
    if (!sameProblem(pick, last)) break;
    pick = generateProblem(difficulty);
  }
  return pick;
}

function normalize(raw: string) {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[–—−]/g, "-")
    .replace(/,/g, "")
    .replace(/\s+/g, " ");
}

function normalizePlace(raw: string) {
  return normalize(raw)
    .replace(/\s+place$/, "")
    .replace(/(\d+)\s+s\b/g, "$1s")
    .replace(/\./g, "");
}

function parseCompare(raw: string): CompareOp | null {
  const value = normalize(raw);
  if (value === "<" || value === "less" || value === "lt" || value === "less than") {
    return "<";
  }
  if (
    value === "=" ||
    value === "==" ||
    value === "equal" ||
    value === "equals" ||
    value === "equal to"
  ) {
    return "=";
  }
  if (
    value === ">" ||
    value === "greater" ||
    value === "gt" ||
    value === "greater than"
  ) {
    return ">";
  }
  return null;
}

function numericValueCandidates(digit: number, power: number) {
  if (digit === 0) return ["0", "0.0", "0.00", "0.000", ".0", ".00", ".000"];
  if (power >= 0) {
    const n = String(digit * 10 ** power);
    return [n, withCommas(digit * 10 ** power).replace(/,/g, ""), n];
  }
  const fixed = (digit / 10 ** -power).toFixed(-power);
  return [fixed, fixed.replace(/^0/, "")];
}

function valueWordAliases(digit: number, place: PlaceId) {
  const word = DIGIT_WORDS[digit];
  const meta = PLACE_META[place];
  const aliases = [
    `${word} ${meta.label}`,
    `${digit} ${meta.label}`,
    `${word} ${meta.singular}`,
    `${digit} ${meta.singular}`,
  ];
  if (place === "ones") aliases.push(word, String(digit));
  if (place === "tens") aliases.push(TENS_WORDS[digit]);
  if (place === "hundreds") {
    aliases.push(`${word} hundred`, `${digit} hundred`);
  }
  if (place === "thousands") {
    aliases.push(`${word} thousand`, `${digit} thousand`);
  }
  if (place === "tenThousands") {
    aliases.push(`${word} ten thousand`, `${digit} ten thousand`);
  }
  if (place === "hundredThousands") {
    aliases.push(`${word} hundred thousand`, `${digit} hundred thousand`);
  }
  if (place === "millions") {
    aliases.push(`${word} million`, `${digit} million`);
  }
  return aliases.map((item) => normalize(item));
}

function matchesPlace(raw: string, place: PlaceId) {
  const value = normalizePlace(raw);
  return PLACE_META[place].aliases.some(
    (alias) => normalizePlace(alias) === value,
  );
}

function matchesValue(raw: string, digit: number, place: PlaceId) {
  const value = normalize(raw);
  const power = PLACE_META[place].power;
  const numeric = numericValueCandidates(digit, power).map((item) =>
    normalize(item),
  );
  if (numeric.includes(value)) return true;
  return valueWordAliases(digit, place).includes(value);
}

function parseExpandedPart(part: string): number | null {
  const compact = normalize(part);
  if (/^\d+(\.\d+)?$/.test(compact) || /^\.\d+$/.test(compact)) {
    const n = Number(compact);
    return Number.isFinite(n) ? n : null;
  }
  const match = compact.match(/^(\d+)\s+([a-z ]+)$/);
  if (!match) return null;
  const digit = Number(match[1]);
  const placeName = normalizePlace(match[2] ?? "");
  const place = (Object.keys(PLACE_META) as PlaceId[]).find((id) =>
    PLACE_META[id].aliases.some((alias) => normalizePlace(alias) === placeName),
  );
  if (!place) return null;
  return digit * 10 ** PLACE_META[place].power;
}

function matchesExpanded(raw: string, digits: string) {
  const prepared = normalize(raw)
    .replace(/\s+plus\s+/g, "+")
    .replace(/\s+and\s+/g, "+")
    .replace(/\s*\+\s*/g, "+");
  const parts = prepared.split("+").filter(Boolean);
  if (parts.length === 0) return false;
  const nonzero = [...digits].filter((digit) => digit !== "0").length;
  if (parts.length < 2 && nonzero > 1) return false;
  let sum = 0;
  for (const part of parts) {
    const value = parseExpandedPart(part);
    if (value === null) return false;
    sum += value;
  }
  return sum === Number(digits);
}

function matchesRounded(raw: string, expectedThousandths: number) {
  const value = normalize(raw);
  if (!/^-?\d+(\.\d+)?$/.test(value) && !/^\.\d+$/.test(value)) return false;
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  return Math.round(n * 1000) === expectedThousandths;
}

function matchesAnswer(raw: string, problem: Problem) {
  if (problem.kind === "place") return matchesPlace(raw, problem.place);
  if (problem.kind === "value") {
    return matchesValue(raw, problem.digit, problem.place);
  }
  if (problem.kind === "expanded") {
    return matchesExpanded(raw, problem.digits);
  }
  if (problem.kind === "compare") {
    return parseCompare(raw) === problem.answer;
  }
  return matchesRounded(raw, problem.expectedThousandths);
}

function expectedLabel(problem: Problem) {
  switch (problem.kind) {
    case "place": {
      const shown = formatDigits(problem.digits, problem.decimalPlaces);
      const digit = problem.digits[problem.highlightIndex];
      return `${digit} in ${shown} is in the ${PLACE_META[problem.place].label} place`;
    }
    case "value": {
      const shown = formatDigits(problem.digits, problem.decimalPlaces);
      return `The ${problem.digit} in ${shown} is worth ${formatPlaceValue(problem.digit, problem.place)}`;
    }
    case "expanded":
      return `${formatDigits(problem.digits, 0)} = ${formatExpanded(problem.digits)}`;
    case "compare":
      return `${formatDigits(problem.left, 0)} ${problem.answer} ${formatDigits(problem.right, 0)}`;
    case "round":
      return `${formatDigits(problem.digits, problem.decimalPlaces)} rounded to the nearest ${PLACE_META[problem.place].singular} is ${formatThousandths(problem.expectedThousandths, Math.max(0, -PLACE_META[problem.place].power))}`;
  }
}

function formatPlaceValue(digit: number, place: PlaceId) {
  const power = PLACE_META[place].power;
  if (digit === 0) return "0";
  if (power >= 0) return withCommas(digit * 10 ** power);
  return (digit / 10 ** -power).toFixed(-power);
}

function promptFor(problem: Problem) {
  switch (problem.kind) {
    case "place":
      return "What place is the underlined digit?";
    case "value":
      return "What is the value of the underlined digit?";
    case "expanded":
      return "Write this number in expanded form.";
    case "compare":
      return "Compare the two numbers.";
    case "round":
      return `Round to the nearest ${PLACE_META[problem.place].singular}.`;
  }
}

function inputHint(problem: Problem) {
  switch (problem.kind) {
    case "place":
      return "Type tens, 10s, or ten. Press Enter to check.";
    case "value":
      return "Type 40, 4 tens, or four tens. Decimals like 0.4 or 4 tenths also work.";
    case "expanded":
      return "Type 3,000+400+5 or 3 thousands + 4 hundreds + 5 ones.";
    case "compare":
      return "Tap <, =, or >, or type the symbol and press Enter.";
    case "round":
      return "Type the rounded number. Press Enter to check.";
  }
}

function inputPlaceholder(problem: Problem) {
  switch (problem.kind) {
    case "place":
      return "tens";
    case "value":
      return "40";
    case "expanded":
      return "3000+400+5";
    case "compare":
      return "<  =  >";
    case "round":
      return "350";
  }
}

function inputLabel(problem: Problem) {
  switch (problem.kind) {
    case "place":
      return "Place";
    case "value":
      return "Value";
    case "expanded":
      return "Expanded form";
    case "compare":
      return "Comparison";
    case "round":
      return "Rounded number";
  }
}

function summarizeProblem(problem: Problem) {
  return expectedLabel(problem);
}

function numberAriaLabel(problem: PlaceProblem | ValueProblem) {
  const shown = formatDigits(problem.digits, problem.decimalPlaces);
  const digit = problem.digits[problem.highlightIndex];
  return `${shown}, with the ${PLACE_META[problem.place].label} digit ${digit} underlined`;
}

export function PlaceValuePractice() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [mode, setMode] = useState<Mode>("practice");
  const [phase, setPhase] = useState<Phase>("setup");
  const [showChart, setShowChart] = useState(false);
  const [problem, setProblem] = useState<Problem>(() =>
    makePlaceValue("40", 0, "place"),
  );
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [records, setRecords] = useState<PlaceRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [focusProblems, setFocusProblems] = useState<Problem[] | undefined>(
    undefined,
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const shownAtRef = useRef(0);
  const sessionStartRef = useRef(0);
  const phaseRef = useRef(phase);
  const endingRef = useRef(false);
  const busyRef = useRef(false);
  const advanceTimerRef = useRef<number | null>(null);
  const recordsRef = useRef(records);
  recordsRef.current = records;

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const expected = expectedLabel(problem);

  const stats = useMemo(() => {
    const attempted = records.length;
    const correct = records.filter((item) => item.correct).length;
    const missed = uniqueProblems(
      records.filter((item) => !item.correct).map((item) => item.problem),
    );
    const slow = uniqueProblems(
      records
        .filter((item) => item.correct && item.ms >= SLOW_MS)
        .map((item) => item.problem),
    );
    const accuracy =
      attempted === 0 ? 0 : Math.round((correct / attempted) * 100);
    return { attempted, correct, missed, slow, accuracy };
  }, [records]);

  const focusInput = () => {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const startSession = useCallback(
    (retry?: Problem[]) => {
      trackEvent(analyticsEvents.practiceStart, {
        tool: TOOL_SLUG,
        mode,
      });
      const first = nextProblem(difficulty, null, retry);
      setFocusProblems(retry);
      setProblem(first);
      setInput("");
      setFeedback(null);
      setRecords([]);
      recordsRef.current = [];
      setStreak(0);
      setBestStreak(0);
      setTimeLeft(TIMED_SECONDS);
      setPhase("playing");
      endingRef.current = false;
      busyRef.current = false;
      clearAdvanceTimer();
      shownAtRef.current = Date.now();
      sessionStartRef.current = Date.now();
    },
    [difficulty, mode],
  );

  const finishSession = useCallback(() => {
    if (endingRef.current) return;
    endingRef.current = true;
    const current = recordsRef.current;
    trackEvent(analyticsEvents.practiceFinish, {
      tool: TOOL_SLUG,
      mode,
      score: current.filter((item) => item.correct).length,
      count: current.length,
    });
    setPhase("results");
    setFeedback(null);
  }, [mode]);

  const submitAnswer = useCallback(
    (raw: string) => {
      if (phaseRef.current !== "playing" || busyRef.current) return;
      const value = raw.trim();
      if (value.length === 0) return;

      busyRef.current = true;
      const correct = matchesAnswer(value, problem);
      const ms = Date.now() - shownAtRef.current;
      const record: PlaceRecord = { problem, ms, correct };

      setRecords((prev) => {
        const next = [...prev, record];
        recordsRef.current = next;
        return next;
      });
      setFeedback(correct ? "correct" : "wrong");

      if (correct) {
        setStreak((prev) => {
          const next = prev + 1;
          setBestStreak((best) => Math.max(best, next));
          return next;
        });
      } else {
        setStreak(0);
      }

      const delay =
        mode === "timed" ? (correct ? 700 : 1100) : correct ? 2000 : 2800;

      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => {
        if (!correct && mode === "streak") {
          busyRef.current = false;
          finishSession();
          return;
        }
        if (phaseRef.current !== "playing") {
          busyRef.current = false;
          return;
        }
        const upcoming = nextProblem(difficulty, problem, focusProblems);
        setProblem(upcoming);
        setInput("");
        setFeedback(null);
        shownAtRef.current = Date.now();
        busyRef.current = false;
        focusInput();
      }, delay);
    },
    [difficulty, finishSession, focusProblems, mode, problem],
  );

  useEffect(() => () => clearAdvanceTimer(), []);

  useEffect(() => {
    if (phase !== "playing" || mode !== "timed") return;

    const tick = () => {
      const remaining = Math.max(
        0,
        TIMED_SECONDS - (Date.now() - sessionStartRef.current) / 1000,
      );
      setTimeLeft(remaining);
      if (remaining <= 0) finishSession();
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [finishSession, mode, phase]);

  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    focusInput();
  }, [feedback, phase, problem]);

  const padPress = (value: string) => {
    if (phase !== "playing" || feedback) return;
    if (value === "back") {
      setInput((prev) => prev.slice(0, -1));
      focusInput();
      return;
    }
    if (value === "go") {
      submitAnswer(input);
      return;
    }
    setInput((prev) => (prev.length >= MAX_INPUT ? prev : `${prev}${value}`));
    focusInput();
  };

  const printChart = () => {
    trackEvent(analyticsEvents.printChart, { tool: TOOL_SLUG });
    setShowChart(true);
    window.setTimeout(() => window.print(), 50);
  };

  const retryProblems = uniqueProblems([...stats.missed, ...stats.slow]);

  return (
    <div>
      <div className="no-print snap-panel">
        {phase === "setup" ? (
          <SetupPanel
            difficulty={difficulty}
            mode={mode}
            onDifficulty={setDifficulty}
            onMode={setMode}
            onStart={() => startSession()}
          />
        ) : null}

        {phase === "playing" ? (
          <PlayPanel
            difficulty={difficulty}
            mode={mode}
            problem={problem}
            expected={expected}
            input={input}
            inputRef={inputRef}
            feedback={feedback}
            streak={streak}
            stats={stats}
            timeLeft={timeLeft}
            onInput={setInput}
            onSubmit={() => submitAnswer(input)}
            onSubmitValue={submitAnswer}
            onPad={padPress}
            onFinish={finishSession}
          />
        ) : null}

        {phase === "results" ? (
          <ResultsPanel
            mode={mode}
            stats={stats}
            bestStreak={bestStreak}
            onAgain={() => startSession(focusProblems)}
            onRetryMissed={
              retryProblems.length > 0
                ? () => startSession(retryProblems)
                : undefined
            }
            onSetup={() => {
              setPhase("setup");
              setFocusProblems(undefined);
            }}
          />
        ) : null}
      </div>

      <div className="no-print mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex min-h-11 items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4 accent-[var(--accent)]"
            checked={showChart}
            onChange={(event) => setShowChart(event.target.checked)}
          />
          Show printable place-value chart
        </label>
        <button
          type="button"
          onClick={printChart}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink hover:border-accent/50"
        >
          Print chart
        </button>
      </div>

      {showChart ? (
        <div className="no-print mt-4">
          <PlaceValueChart />
        </div>
      ) : null}

      <div className="mt-6 hidden print-only">
        <h2 className="mb-3 font-display text-2xl">Place-value chart</h2>
        <PlaceValueChart />
      </div>
    </div>
  );
}

function SetupPanel({
  difficulty,
  mode,
  onDifficulty,
  onMode,
  onStart,
}: {
  difficulty: Difficulty;
  mode: Mode;
  onDifficulty: (difficulty: Difficulty) => void;
  onMode: (mode: Mode) => void;
  onStart: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Choose a level</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Start with ones, tens, and hundreds. Then expand, compare, and round.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {DIFFICULTIES.map((item) => (
          <ModeButton
            key={item.id}
            title={item.title}
            detail={item.detail}
            active={difficulty === item.id}
            onClick={() => onDifficulty(item.id)}
          />
        ))}
      </div>

      <h3 className="mt-6 font-display text-xl text-ink">Mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ModeButton
          title="Practice"
          detail="Untimed. Stop whenever you like."
          active={mode === "practice"}
          onClick={() => onMode("practice")}
        />
        <ModeButton
          title="Timed quiz"
          detail="60 seconds. How many can you get?"
          active={mode === "timed"}
          onClick={() => onMode("timed")}
        />
        <ModeButton
          title="Streak mode"
          detail="Keep going until the first miss."
          active={mode === "streak"}
          onClick={() => onMode("streak")}
        />
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink sm:w-auto"
      >
        Start
      </button>
    </div>
  );
}

function PlayPanel({
  difficulty,
  mode,
  problem,
  expected,
  input,
  inputRef,
  feedback,
  streak,
  stats,
  timeLeft,
  onInput,
  onSubmit,
  onSubmitValue,
  onPad,
  onFinish,
}: {
  difficulty: Difficulty;
  mode: Mode;
  problem: Problem;
  expected: string;
  input: string;
  inputRef: RefObject<HTMLInputElement | null>;
  feedback: "correct" | "wrong" | null;
  streak: number;
  stats: { attempted: number; correct: number; accuracy: number };
  timeLeft: number;
  onInput: (value: string) => void;
  onSubmit: () => void;
  onSubmitValue: (value: string) => void;
  onPad: (value: string) => void;
  onFinish: () => void;
}) {
  const isCompare = problem.kind === "compare";
  const showEasyPlaces = difficulty === "easy" && problem.kind === "place";
  const showPad = !isCompare && problem.kind !== "place";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Score" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Streak" value={`${streak}`} />
        <Stat
          label={mode === "timed" ? "Time" : "Tried"}
          value={mode === "timed" ? `${Math.ceil(timeLeft)}s` : `${stats.attempted}`}
        />
      </div>

      <p
        className={`mt-5 min-h-8 text-center text-base font-semibold ${
          feedback === "correct"
            ? "text-ok"
            : feedback === "wrong"
              ? "text-bad"
              : "font-medium text-ink-muted"
        }`}
        aria-live="polite"
      >
        {feedback === "correct"
          ? `Yes! ${expected}`
          : feedback === "wrong"
            ? `Not quite. ${expected}`
            : promptFor(problem)}
      </p>

      <div
        className={`mt-3 rounded-2xl border px-4 py-6 text-center sm:px-6 ${
          feedback === "correct"
            ? "animate-pop border-ok bg-ok-soft"
            : feedback === "wrong"
              ? "animate-shake border-bad bg-bad-soft"
              : "border-line bg-bg"
        }`}
      >
        <ProblemVisual problem={problem} />
      </div>

      <form
        className="mt-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor="place-value-answer"
        >
          {inputLabel(problem)}
        </label>
        <input
          id="place-value-answer"
          ref={inputRef}
          value={input}
          onChange={(event) => onInput(event.target.value.slice(0, MAX_INPUT))}
          inputMode={
            problem.kind === "value" || problem.kind === "round"
              ? "decimal"
              : "text"
          }
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          disabled={Boolean(feedback)}
          placeholder={inputPlaceholder(problem)}
          aria-describedby="place-value-answer-hint"
          className="mt-2 min-h-12 w-full rounded-xl border border-line bg-bg px-3 text-center font-display text-2xl text-ink outline-none focus:border-secondary sm:text-3xl"
        />
        <p id="place-value-answer-hint" className="mt-2 text-sm text-ink-muted">
          {inputHint(problem)}
        </p>
        {showEasyPlaces ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {EASY_PLACES.map((place) => (
              <button
                key={place}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => onSubmitValue(PLACE_META[place].label)}
                className="min-h-14 rounded-xl border border-line bg-bg text-base font-semibold capitalize text-ink hover:border-accent/50 disabled:opacity-50"
              >
                {PLACE_META[place].label}
              </button>
            ))}
          </div>
        ) : null}
        {isCompare ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                { op: "<" as const, label: "Less than" },
                { op: "=" as const, label: "Equal to" },
                { op: ">" as const, label: "Greater than" },
              ] as const
            ).map((item) => (
              <button
                key={item.op}
                type="button"
                aria-label={item.label}
                disabled={Boolean(feedback)}
                onClick={() => onSubmitValue(item.op)}
                className="min-h-14 rounded-xl border border-line bg-bg text-2xl font-semibold text-ink hover:border-accent/50 disabled:opacity-50"
              >
                {item.op}
                <span className="mt-0.5 block text-xs font-medium text-ink-muted">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={Boolean(feedback) || input.trim().length === 0}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-ink disabled:opacity-50 sm:w-auto"
          >
            Check
          </button>
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-12 items-center justify-center px-3 text-sm font-semibold text-ink-muted hover:text-ink"
          >
            {mode === "practice" ? "Finish practice" : "End early"}
          </button>
        </div>
      </form>

      {showPad ? (
        <div className="mx-auto mt-5 grid max-w-sm grid-cols-3 gap-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
            (key) => (
              <button
                key={key}
                type="button"
                aria-label={
                  key === "back"
                    ? "Delete"
                    : key === "."
                      ? "Decimal point"
                      : `Digit ${key}`
                }
                onClick={() => onPad(key)}
                className={`min-h-14 touch-manipulation rounded-xl text-lg font-semibold ${
                  key === "back"
                    ? "border border-line bg-surface-muted text-ink"
                    : "border border-line bg-bg text-ink hover:border-accent/50"
                }`}
              >
                {key === "back" ? "⌫" : key}
              </button>
            ),
          )}
          {problem.kind === "expanded" ? (
            <button
              type="button"
              aria-label="Plus"
              onClick={() => onPad("+")}
              className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-lg font-semibold text-ink hover:border-accent/50"
            >
              +
            </button>
          ) : (
            <button
              type="button"
              aria-label="Comma"
              onClick={() => onPad(",")}
              className="min-h-14 touch-manipulation rounded-xl border border-line bg-bg text-lg font-semibold text-ink hover:border-accent/50"
            >
              ,
            </button>
          )}
          <button
            type="button"
            onClick={() => onPad("go")}
            className="col-span-2 min-h-14 touch-manipulation rounded-xl bg-accent text-lg font-semibold text-accent-ink"
          >
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ResultsPanel({
  mode,
  stats,
  bestStreak,
  onAgain,
  onRetryMissed,
  onSetup,
}: {
  mode: Mode;
  stats: {
    attempted: number;
    correct: number;
    accuracy: number;
    missed: Problem[];
    slow: Problem[];
  };
  bestStreak: number;
  onAgain: () => void;
  onRetryMissed?: () => void;
  onSetup: () => void;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Nice work</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {mode === "timed"
          ? "Sixty seconds are up."
          : mode === "streak"
            ? "Streak ended on a miss — those are the problems to keep."
            : "Here’s what this round looked like."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Correct" value={`${stats.correct}`} />
        <Stat label="Accuracy" value={`${stats.accuracy}%`} />
        <Stat label="Best streak" value={`${bestStreak}`} />
        <Stat label="Tried" value={`${stats.attempted}`} />
      </div>

      <ProblemList
        title="Missed items"
        empty="No misses. That’s the goal."
        problems={stats.missed}
      />
      <ProblemList
        title="Slow items (4+ seconds)"
        empty="No slow items this round."
        problems={stats.slow}
      />

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onAgain}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink"
        >
          Practice again
        </button>
        {onRetryMissed ? (
          <button
            type="button"
            onClick={onRetryMissed}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line px-4 text-sm font-semibold text-ink"
          >
            Retry slow & missed
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSetup}
          className="inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-ink-muted hover:text-ink"
        >
          Change settings
        </button>
      </div>
    </div>
  );
}

function ProblemList({
  title,
  empty,
  problems,
}: {
  title: string;
  empty: string;
  problems: Problem[];
}) {
  return (
    <section className="mt-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {problems.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{empty}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {problems.map((problem) => (
            <li
              key={problemKey(problem)}
              className="rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm tabular-nums"
            >
              {summarizeProblem(problem)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProblemVisual({ problem }: { problem: Problem }) {
  if (problem.kind === "compare") {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <p className="font-display text-4xl tabular-nums tracking-wide text-ink sm:text-5xl">
          {formatDigits(problem.left, 0)}
        </p>
        <span className="font-display text-3xl text-ink-muted">?</span>
        <p className="font-display text-4xl tabular-nums tracking-wide text-ink sm:text-5xl">
          {formatDigits(problem.right, 0)}
        </p>
      </div>
    );
  }

  if (problem.kind === "expanded") {
    return (
      <p className="font-display text-4xl tabular-nums tracking-wide text-ink sm:text-5xl">
        {formatDigits(problem.digits, 0)}
      </p>
    );
  }

  if (problem.kind === "round") {
    return (
      <p className="font-display text-4xl tabular-nums tracking-wide text-ink sm:text-5xl">
        {formatDigits(problem.digits, problem.decimalPlaces)}
      </p>
    );
  }

  return (
    <HighlightedNumber
      digits={problem.digits}
      decimalPlaces={problem.decimalPlaces}
      highlightIndex={problem.highlightIndex}
      label={numberAriaLabel(problem)}
    />
  );
}

function HighlightedNumber({
  digits,
  decimalPlaces,
  highlightIndex,
  label,
}: {
  digits: string;
  decimalPlaces: number;
  highlightIndex: number;
  label: string;
}) {
  const display = formatDigits(digits, decimalPlaces);
  const mark = displayIndexOfDigit(digits, decimalPlaces, highlightIndex);

  return (
    <p
      className="font-display text-5xl tabular-nums text-ink sm:text-6xl"
      style={{ letterSpacing: "0.02em" }}
      aria-label={label}
    >
      {display.split("").map((char, index) => {
        const highlighted = index === mark && /\d/.test(char);
        const punct = char === "," || char === ".";
        return (
          <span
            key={`${char}-${index}`}
            className={
              highlighted
                ? "inline-block border-b-[3px] border-secondary px-[0.08em] text-secondary"
                : punct
                  ? "inline-block px-[0.06em] text-ink-muted"
                  : "inline-block px-[0.08em]"
            }
          >
            {char}
          </span>
        );
      })}
    </p>
  );
}

function PlaceValueChart() {
  return (
    <figure className="overflow-x-auto rounded-2xl border border-line bg-surface p-3 sm:p-4">
      <figcaption className="mb-3 text-sm font-medium text-ink">
        Place-value chart — hundred thousands through hundredths
      </figcaption>
      <table className="w-full min-w-[640px] border-collapse text-center text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="border border-line bg-surface-muted px-1.5 py-2 font-semibold"
            >
              Place
            </th>
            {CHART_COLUMNS.map((place) => (
              <th
                key={place.point ? "decimal-point" : place.label}
                scope="col"
                className={`border border-line bg-surface-muted px-1.5 py-2 font-semibold ${
                  place.point ? "w-8" : ""
                }`}
              >
                {place.point ? (
                  <span className="sr-only">Decimal point</span>
                ) : (
                  place.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th
              scope="row"
              className="border border-line bg-surface-muted px-1.5 py-2 font-semibold"
            >
              Digit
            </th>
            {CHART_COLUMNS.map((place) => (
              <td
                key={`digit-${place.point ? "point" : place.label}`}
                className={`border border-line px-1.5 py-3 font-display text-xl tabular-nums ${
                  place.point ? "text-ink-muted" : ""
                }`}
              >
                {place.digit}
              </td>
            ))}
          </tr>
          <tr>
            <th
              scope="row"
              className="border border-line bg-surface-muted px-1.5 py-2 font-semibold"
            >
              Value
            </th>
            {CHART_COLUMNS.map((place) => (
              <td
                key={`value-${place.point ? "point" : place.label}`}
                className="border border-line px-1.5 py-2 tabular-nums"
              >
                {place.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-sm text-ink-muted">
        Example: 247,365.82 — the 6 is in the tens place and is worth 60.
      </p>
    </figure>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function ModeButton({
  title,
  detail,
  active,
  onClick,
}: {
  title: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-3 text-left ${
        active
          ? "border-accent bg-accent-soft"
          : "border-line bg-bg hover:border-accent/40"
      }`}
    >
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm text-ink-muted">{detail}</span>
    </button>
  );
}
