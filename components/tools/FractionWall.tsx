"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { MathLabFrame, useMathLabProjector } from "@/components/labs/MathLabFrame";
import { analyticsEvents, trackEvent } from "@/lib/analytics";
import {
  challengeStatus,
  describeChallenge,
  describeCompare,
  describeExplore,
  formatDecimal,
  formatPercent,
  fractionsEqual,
  pickKey,
  rowName,
  samePick,
  targetsFor,
  WALL_STOPS,
  type ChallengeStatus,
  type FractionPick,
} from "@/lib/fraction-wall";

type Mode = "explore" | "compare" | "challenge";
type Slot = "a" | "b";
type BrickTone = "idle" | "a" | "b" | "both" | "success";

const TOOL_SLUG = "fraction-wall";
const LABEL = "w-16 shrink-0 text-right sm:w-[4.5rem]";

const MODES: { id: Mode; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "compare", label: "Compare" },
  { id: "challenge", label: "Challenge" },
];

function mapIndex(index: number, fromDen: number, toDen: number) {
  const center = (index + 0.5) / fromDen;
  return Math.min(toDen - 1, Math.max(0, Math.floor(center * toDen - 1e-9)));
}

function selectedRows(counts: Record<number, number>, maxDen: number): FractionPick[] {
  const rows: FractionPick[] = [];
  for (let denominator = 1; denominator <= maxDen; denominator += 1) {
    const count = counts[denominator] ?? 0;
    if (count > 0) rows.push({ count, denominator });
  }
  return rows;
}

function pillClass(active: boolean) {
  return `inline-flex min-h-11 items-center justify-center rounded-full border px-3.5 text-sm font-semibold ${
    active
      ? "border-ink bg-accent text-accent-ink"
      : "border-line bg-surface text-ink hover:border-ink"
  }`;
}

function brickTone(index: number, countA: number, countB: number, success: boolean): BrickTone {
  const inA = index < countA;
  const inB = index < countB;
  if (!inA && !inB) return "idle";
  if (success && inA) return "success";
  if (inA && inB) return "both";
  if (inB) return "b";
  return "a";
}

function toneClass(tone: BrickTone) {
  if (tone === "success") return "border-ok bg-ok text-accent-ink";
  if (tone === "both" || tone === "b") return "fraction-stripe border-accent text-accent-ink";
  if (tone === "a") return "border-accent bg-accent text-accent-ink";
  return "border-line bg-surface text-ink hover:bg-accent-soft";
}

function StackedFraction({
  count,
  denominator,
  large,
}: {
  count: number;
  denominator: number;
  large: boolean;
}) {
  const size = large ? "text-6xl" : "text-4xl sm:text-5xl";
  if (denominator <= 1) {
    return <span className={`font-display leading-none text-ink ${size}`}>1</span>;
  }
  return (
    <span
      className={`inline-flex flex-col items-center font-display leading-none text-ink ${size}`}
    >
      <span>{count}</span>
      <span className="my-1 h-0.5 w-[1.15em] bg-current" />
      <span>{denominator}</span>
    </span>
  );
}

function PickFigure({
  label,
  pick,
  large,
  decimals,
  percents,
  active,
}: {
  label: string;
  pick: FractionPick | null;
  large: boolean;
  decimals: boolean;
  percents: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`min-w-24 ${
        active ? "rounded-2xl px-3 py-2 ring-2 ring-secondary" : "px-1 py-2"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </p>
      {pick ? (
        <StackedFraction
          count={pick.count}
          denominator={pick.denominator}
          large={large}
        />
      ) : (
        <p className={`font-display text-ink-muted ${large ? "text-6xl" : "text-5xl"}`}>
          —
        </p>
      )}
      {pick && (decimals || percents) ? (
        <p className="mt-2 text-sm font-medium tabular-nums text-ink-muted">
          {decimals ? formatDecimal(pick.count, pick.denominator) : ""}
          {decimals && percents ? " · " : ""}
          {percents ? formatPercent(pick.count, pick.denominator) : ""}
        </p>
      ) : null}
    </div>
  );
}

function LengthTrack({
  label,
  pick,
  tone,
  active,
}: {
  label: string;
  pick: FractionPick | null;
  tone: "a" | "b" | "target";
  active?: boolean;
}) {
  const width = pick ? (pick.count / pick.denominator) * 100 : 0;
  const fill =
    tone === "b"
      ? "fraction-stripe"
      : tone === "target"
        ? "bg-ink/20"
        : "bg-accent";
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <div className={`${LABEL} text-xs font-semibold uppercase tracking-wide text-ink-muted`}>
        {label}
      </div>
      <div
        className={`h-9 flex-1 overflow-hidden rounded-xl bg-surface-muted ${
          tone === "target" ? "border-2 border-dashed border-ink" : ""
        } ${active ? "ring-2 ring-secondary" : ""}`}
      >
        <div
          className={`h-full ${fill} transition-[width] duration-300 ease-out motion-reduce:transition-none`}
          style={{ width: `${Math.max(0, Math.min(100, width))}%` }}
        />
      </div>
    </div>
  );
}

function FractionRow({
  denominator,
  countA,
  countB,
  success,
  equal,
  cursorIndex,
  projector,
  onSelect,
}: {
  denominator: number;
  countA: number;
  countB: number;
  success: boolean;
  equal: boolean;
  cursorIndex: number | null;
  projector: boolean;
  onSelect: (denominator: number, index: number) => void;
}) {
  const unit = denominator === 1 ? "1" : `1/${denominator}`;
  const name = rowName(denominator);
  const shaded = Math.max(countA, countB);
  return (
    <div
      className="flex items-stretch gap-2"
      role="group"
      aria-label={name.charAt(0).toUpperCase() + name.slice(1)}
    >
      <div className={`${LABEL} flex items-center justify-end text-sm font-semibold tabular-nums text-ink`}>
        {unit}
      </div>
      <div className="relative flex min-w-0 flex-1">
        {Array.from({ length: denominator }, (_, index) => {
          const tone = brickTone(index, countA, countB, success);
          const pressed = tone !== "idle";
          const piece = index + 1;
          const built = denominator === 1 ? "1 whole" : `${piece}/${denominator}`;
          const face = denominator === 1 ? "1" : `${piece}/${denominator}`;
          const labelSize =
            denominator >= 10
              ? "text-[10px] sm:text-[11px]"
              : projector
                ? "text-sm"
                : "text-[11px] sm:text-xs";
          return (
            <button
              key={index}
              type="button"
              data-den={denominator}
              data-index={index}
              tabIndex={cursorIndex === index ? 0 : -1}
              aria-pressed={pressed}
              aria-label={
                pressed
                  ? `${built}, selected, ${name} row`
                  : `Select ${built} on the ${name} row`
              }
              onClick={() => onSelect(denominator, index)}
              className={`flex min-h-12 min-w-11 flex-1 touch-manipulation select-none items-center justify-center border-y border-r px-0.5 font-semibold transition-colors duration-200 first:rounded-l-xl first:border-l last:rounded-r-xl focus-visible:z-10 motion-reduce:transition-none ${
                projector ? "min-h-14" : "sm:min-h-14"
              } ${labelSize} ${toneClass(tone)}`}
            >
              <span className="truncate">{face}</span>
            </button>
          );
        })}
        {equal && shaded > 0 ? (
          <span
            className="pointer-events-none absolute bottom-0 left-0 z-10 h-1 bg-secondary"
            style={{ width: `${(shaded / denominator) * 100}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function FractionWallChart() {
  const denominators = Array.from({ length: 12 }, (_, index) => index + 1);
  return (
    <div className="break-inside-avoid">
      <h2 className="font-display text-2xl text-ink">Fraction wall</h2>
      <p className="mt-1 text-sm text-ink">Each row adds up to 1. Halves through twelfths.</p>
      <div className="mt-4 space-y-1">
        {denominators.map((denominator) => (
          <div key={denominator} className="flex items-stretch gap-2">
            <div className="flex w-12 shrink-0 items-center justify-end text-[11px] font-semibold text-ink">
              {denominator === 1 ? "1" : `1/${denominator}`}
            </div>
            <div className="flex min-w-0 flex-1 border-y border-l border-ink">
              {Array.from({ length: denominator }, (_, index) => (
                <div
                  key={index}
                  className="flex flex-1 items-center justify-center border-r border-ink py-1.5 text-center text-[10px] font-semibold text-ink"
                >
                  {denominator === 1 ? "1" : `1/${denominator}`}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink">FactsTools</p>
    </div>
  );
}

function compareVerdict(sideA: FractionPick | null, sideB: FractionPick | null) {
  if (!sideA || !sideB) return "Pick two fractions";
  const compared =
    sideA.count * sideB.denominator - sideB.count * sideA.denominator;
  if (compared === 0) return "Equal";
  return compared > 0 ? "A is larger" : "B is larger";
}

export function FractionWall() {
  const [mode, setMode] = useState<Mode>("explore");
  const [maxDen, setMaxDen] = useState(12);
  const [showDecimals, setShowDecimals] = useState(true);
  const [showPercents, setShowPercents] = useState(true);
  const [showEquivalents, setShowEquivalents] = useState(true);
  const [exploreCounts, setExploreCounts] = useState<Record<number, number>>({});
  const [focusDen, setFocusDen] = useState<number | null>(null);
  const [slot, setSlot] = useState<Slot>("a");
  const [sideA, setSideA] = useState<FractionPick | null>(null);
  const [sideB, setSideB] = useState<FractionPick | null>(null);
  const [targetKey, setTargetKey] = useState("3/4");
  const [challengePick, setChallengePick] = useState<FractionPick | null>(null);
  const [cursor, setCursor] = useState({ den: 2, index: 0 });
  const [showChart, setShowChart] = useState(false);

  const speech = useMemo(
    () => ({ decimals: showDecimals, percents: showPercents }),
    [showDecimals, showPercents],
  );

  const pool = targetsFor(maxDen);
  const target =
    pool.find((item) => pickKey(item) === targetKey) ?? pool[0] ?? {
      count: 1,
      denominator: 2,
    };

  const resetSelections = useCallback(() => {
    setExploreCounts({});
    setFocusDen(null);
    setSideA(null);
    setSideB(null);
    setSlot("a");
    setChallengePick(null);
  }, []);

  const selectMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    resetSelections();
  };

  const chooseMax = (denominator: number) => {
    setMaxDen(denominator);
    setExploreCounts((prev) => {
      const next: Record<number, number> = {};
      for (let den = 1; den <= denominator; den += 1) {
        const count = prev[den] ?? 0;
        if (count > 0 && count <= den) next[den] = count;
      }
      return next;
    });
    setSideA((prev) => (prev && prev.denominator <= denominator ? prev : null));
    setSideB((prev) => (prev && prev.denominator <= denominator ? prev : null));
    setChallengePick((prev) =>
      prev && prev.denominator <= denominator ? prev : null,
    );
    setFocusDen((prev) => (prev !== null && prev > denominator ? null : prev));
    setCursor((prev) =>
      prev.den <= denominator ? prev : { den: Math.min(2, denominator), index: 0 },
    );
  };

  const onSelect = (denominator: number, index: number) => {
    const next = index + 1;
    setCursor({ den: denominator, index });
    if (mode === "explore") {
      setExploreCounts((prev) => {
        const current = prev[denominator] ?? 0;
        const count = current === next ? 0 : next;
        return { ...prev, [denominator]: count };
      });
      setFocusDen(denominator);
      return;
    }
    if (mode === "compare") {
      if (slot === "a") {
        if (samePick(sideA, denominator, next)) {
          setSideA(null);
          return;
        }
        const wasEmpty = !sideA;
        setSideA({ count: next, denominator });
        if (wasEmpty && !sideB) setSlot("b");
        return;
      }
      if (samePick(sideB, denominator, next)) {
        setSideB(null);
        return;
      }
      const wasEmpty = !sideB;
      setSideB({ count: next, denominator });
      if (wasEmpty && !sideA) setSlot("a");
      return;
    }
    if (samePick(challengePick, denominator, next)) {
      setChallengePick(null);
      return;
    }
    setChallengePick({ count: next, denominator });
  };

  const nextTarget = () => {
    const keys = pool.map((item) => pickKey(item));
    const current = pickKey(target);
    const index = keys.indexOf(current);
    const upcoming = keys[(index + 1) % keys.length] ?? current;
    setTargetKey(upcoming);
    setChallengePick(null);
  };

  const printChart = () => {
    trackEvent(analyticsEvents.printChart, { tool: TOOL_SLUG });
    setShowChart(true);
    window.setTimeout(() => window.print(), 50);
  };

  const rows = selectedRows(exploreCounts, maxDen);
  const focusCount = focusDen ? (exploreCounts[focusDen] ?? 0) : 0;
  const focus =
    focusDen && focusCount > 0
      ? { count: focusCount, denominator: focusDen }
      : (rows[0] ?? null);

  const status: ChallengeStatus = challengeStatus(challengePick, target);
  const sentence =
    mode === "explore"
      ? describeExplore(focus, rows, showEquivalents, speech)
      : mode === "compare"
        ? describeCompare(sideA, sideB, slot, speech)
        : describeChallenge(challengePick, target, speech);

  const sidesEqual =
    sideA !== null &&
    sideB !== null &&
    fractionsEqual(sideA.count, sideA.denominator, sideB.count, sideB.denominator);

  return (
    <div>
      <MathLabFrame
        label="Interactive fraction wall"
        toolbar={
          <>
            <div role="group" aria-label="Mode" className="flex flex-wrap gap-2">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={pillClass(mode === item.id)}
                  aria-pressed={mode === item.id}
                  onClick={() => selectMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Rows shown" className="flex flex-wrap gap-2">
              {WALL_STOPS.map((stop) => (
                <button
                  key={stop}
                  type="button"
                  className={pillClass(maxDen === stop)}
                  aria-pressed={maxDen === stop}
                  aria-label={`Show rows through ${rowName(stop)}`}
                  onClick={() => chooseMax(stop)}
                >
                  {stop === 6
                    ? "Sixths"
                    : stop === 8
                      ? "Eighths"
                      : stop === 10
                        ? "Tenths"
                        : "Twelfths"}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Labels" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={pillClass(showDecimals)}
                aria-pressed={showDecimals}
                onClick={() => setShowDecimals((value) => !value)}
              >
                Decimals
              </button>
              <button
                type="button"
                className={pillClass(showPercents)}
                aria-pressed={showPercents}
                onClick={() => setShowPercents((value) => !value)}
              >
                Percents
              </button>
              <button
                type="button"
                className={pillClass(showEquivalents)}
                aria-pressed={showEquivalents}
                onClick={() => setShowEquivalents((value) => !value)}
              >
                Equivalents
              </button>
            </div>
            {mode === "compare" ? (
              <div role="group" aria-label="Which fraction the next tap sets" className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={pillClass(slot === "a")}
                  aria-pressed={slot === "a"}
                  onClick={() => setSlot("a")}
                >
                  {sideA ? `A ${sideA.count}/${sideA.denominator}` : "Fraction A"}
                </button>
                <button
                  type="button"
                  className={pillClass(slot === "b")}
                  aria-pressed={slot === "b"}
                  onClick={() => setSlot("b")}
                >
                  {sideB ? `B ${sideB.count}/${sideB.denominator}` : "Fraction B"}
                </button>
              </div>
            ) : null}
            {mode === "challenge" ? (
              <button type="button" className="snap-btn-secondary" onClick={nextTarget}>
                New target
              </button>
            ) : null}
            <button type="button" className="snap-btn-secondary" onClick={resetSelections}>
              Clear
            </button>
            <button type="button" className="snap-btn-secondary" onClick={printChart}>
              Print chart
            </button>
          </>
        }
      >
        <FractionWallStage
          mode={mode}
          maxDen={maxDen}
          showDecimals={showDecimals}
          showPercents={showPercents}
          showEquivalents={showEquivalents}
          exploreCounts={exploreCounts}
          sideA={sideA}
          sideB={sideB}
          slot={slot}
          target={target}
          challengePick={challengePick}
          status={status}
          cursor={cursor}
          focus={focus}
          sentence={sentence}
          sidesEqual={sidesEqual}
          onSelect={onSelect}
          onCursor={setCursor}
          onClear={resetSelections}
        />
        <div className="mt-6 hidden print-only">
          <FractionWallChart />
        </div>
      </MathLabFrame>

      {showChart ? (
        <div className="no-print mt-6">
          <FractionWallChart />
        </div>
      ) : null}
    </div>
  );
}

function FractionWallStage({
  mode,
  maxDen,
  showDecimals,
  showPercents,
  showEquivalents,
  exploreCounts,
  sideA,
  sideB,
  slot,
  target,
  challengePick,
  status,
  cursor,
  focus,
  sentence,
  sidesEqual,
  onSelect,
  onCursor,
  onClear,
}: {
  mode: Mode;
  maxDen: number;
  showDecimals: boolean;
  showPercents: boolean;
  showEquivalents: boolean;
  exploreCounts: Record<number, number>;
  sideA: FractionPick | null;
  sideB: FractionPick | null;
  slot: Slot;
  target: FractionPick;
  challengePick: FractionPick | null;
  status: ChallengeStatus;
  cursor: { den: number; index: number };
  focus: FractionPick | null;
  sentence: string;
  sidesEqual: boolean;
  onSelect: (denominator: number, index: number) => void;
  onCursor: (cursor: { den: number; index: number }) => void;
  onClear: () => void;
}) {
  const { projector, exit } = useMathLabProjector();
  const hintId = useId();
  const wallRef = useRef<HTMLDivElement>(null);
  const verdict =
    status === "match"
      ? "text-ok"
      : status === "short" || status === "long"
        ? "text-bad"
        : "text-ink";
  const motion =
    mode === "challenge" && status === "match"
      ? "animate-pop motion-reduce:animate-none"
      : mode === "challenge" && (status === "short" || status === "long")
        ? "animate-shake motion-reduce:animate-none"
        : "";

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (projector) {
        exit();
        return;
      }
      onClear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exit, onClear, projector]);

  const onWallKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const targetNode = event.target;
    if (!(targetNode instanceof HTMLElement) || !targetNode.closest("[data-fraction-wall]")) {
      return;
    }
    event.preventDefault();
    let den = cursor.den <= maxDen ? cursor.den : maxDen;
    let index = cursor.index < den ? cursor.index : den - 1;
    if (event.key === "ArrowRight") index = Math.min(den - 1, index + 1);
    if (event.key === "ArrowLeft") index = Math.max(0, index - 1);
    if (event.key === "Home") index = 0;
    if (event.key === "End") index = den - 1;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const nextDen =
        event.key === "ArrowUp" ? Math.max(1, den - 1) : Math.min(maxDen, den + 1);
      index = mapIndex(index, den, nextDen);
      den = nextDen;
    }
    onCursor({ den, index });
    const button = wallRef.current?.querySelector<HTMLButtonElement>(
      `button[data-den="${den}"][data-index="${index}"]`,
    );
    button?.focus();
    button?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const denominators = Array.from({ length: maxDen }, (_, index) => index + 1);

  return (
    <div className="no-print">
      <div className={motion} aria-hidden="true">
        {mode === "explore" ? (
          <PickFigure
            label="Selected"
            pick={focus}
            large={projector}
            decimals={showDecimals}
            percents={showPercents}
          />
        ) : null}
        {mode === "compare" ? (
          <div className="flex flex-wrap items-end gap-4">
            <PickFigure
              label="Fraction A"
              pick={sideA}
              large={projector}
              decimals={showDecimals}
              percents={showPercents}
              active={slot === "a"}
            />
            <p className="pb-4 font-display text-2xl text-ink sm:text-3xl">
              {compareVerdict(sideA, sideB)}
            </p>
            <PickFigure
              label="Fraction B"
              pick={sideB}
              large={projector}
              decimals={showDecimals}
              percents={showPercents}
              active={slot === "b"}
            />
          </div>
        ) : null}
        {mode === "challenge" ? (
          <div className="flex flex-wrap items-end gap-4">
            <PickFigure
              label="Target"
              pick={target}
              large={projector}
              decimals={showDecimals}
              percents={showPercents}
            />
            <p className={`pb-4 font-display text-2xl sm:text-3xl ${verdict}`}>
              {status === "match"
                ? "Matched"
                : status === "same-row"
                  ? "Try another row"
                  : status === "short"
                    ? "Shorter"
                    : status === "long"
                      ? "Longer"
                      : "Match the length"}
            </p>
            <PickFigure
              label="Yours"
              pick={challengePick}
              large={projector}
              decimals={showDecimals}
              percents={showPercents}
            />
          </div>
        ) : null}
      </div>
      <p
        className={`mt-3 max-w-3xl text-base leading-relaxed sm:text-lg ${verdict}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {sentence}
      </p>

      <div
        ref={wallRef}
        data-fraction-wall
        className="mt-5 overflow-x-auto p-1"
        onKeyDown={onWallKeyDown}
        aria-describedby={hintId}
      >
        <div className="w-full min-w-[40rem] space-y-1.5">
          {mode === "challenge" ? (
            <LengthTrack label="Target" pick={target} tone="target" />
          ) : null}
          {mode === "compare" ? (
            <>
              <LengthTrack label="A" pick={sideA} tone="a" active={slot === "a"} />
              <LengthTrack label="B" pick={sideB} tone="b" active={slot === "b"} />
            </>
          ) : null}
          {denominators.map((denominator) => {
            const countA =
              mode === "explore"
                ? (exploreCounts[denominator] ?? 0)
                : mode === "compare"
                  ? sideA?.denominator === denominator
                    ? sideA.count
                    : 0
                  : challengePick?.denominator === denominator
                    ? challengePick.count
                    : 0;
            const countB =
              mode === "compare" && sideB?.denominator === denominator ? sideB.count : 0;
            const exploreEqual =
              mode === "explore" &&
              showEquivalents &&
              countA > 0 &&
              denominators.some((other) => {
                if (other === denominator) return false;
                const otherCount = exploreCounts[other] ?? 0;
                return otherCount > 0 && fractionsEqual(countA, denominator, otherCount, other);
              });
            const compareEqual =
              mode === "compare" &&
              showEquivalents &&
              sidesEqual &&
              (sideA?.denominator === denominator || sideB?.denominator === denominator);
            return (
              <FractionRow
                key={denominator}
                denominator={denominator}
                countA={countA}
                countB={countB}
                success={
                  mode === "challenge" &&
                  status === "match" &&
                  challengePick?.denominator === denominator
                }
                equal={exploreEqual || compareEqual}
                cursorIndex={cursor.den === denominator ? cursor.index : null}
                projector={projector}
                onSelect={onSelect}
              />
            );
          })}
        </div>
      </div>

      {mode === "compare" ? (
        <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-muted" aria-hidden="true">
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-7 rounded bg-accent" />
            Fraction A
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="fraction-stripe h-4 w-7 rounded" />
            Fraction B
          </span>
        </p>
      ) : null}
      <p id={hintId} className="mt-3 text-sm text-ink-muted">
        Arrows move between bricks. Enter selects. Escape clears.
      </p>
    </div>
  );
}
