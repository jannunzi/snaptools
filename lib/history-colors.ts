import type { HistoryCategoryId } from "@/lib/history-timeline";

type HueBase = {
  h: number;
  s: number;
};

/** Muted, desaturated bases — Apple-clean, not candy. */
const CATEGORY_HUE: Record<HistoryCategoryId, HueBase> = {
  empires: { h: 46, s: 22 },
  inventions: { h: 212, s: 16 },
  musicians: { h: 328, s: 12 },
  wars: { h: 6, s: 20 },
  explorations: { h: 88, s: 12 },
  science: { h: 204, s: 14 },
  art: { h: 28, s: 16 },
  sports: { h: 118, s: 12 },
};

export type EventSwatch = {
  background: string;
  border: string;
  color: string;
};

export type LaneSwatch = {
  background: string;
  border: string;
};

function hashId(id: string) {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function hsl(h: number, s: number, l: number) {
  return `hsl(${Math.round(h)} ${Math.max(0, s).toFixed(1)}% ${l.toFixed(1)}%)`;
}

function baseFor(category: string, hueOverride?: number): HueBase {
  if (hueOverride !== undefined && Number.isFinite(hueOverride)) {
    return { h: ((hueOverride % 360) + 360) % 360, s: 16 };
  }
  if (category in CATEGORY_HUE) {
    return CATEGORY_HUE[category as HistoryCategoryId];
  }
  const n = hashId(category);
  return { h: n % 360, s: 13 };
}

export function resolveLaneHue(
  category: string,
  hueOverride?: number,
): number {
  return baseFor(category, hueOverride).h;
}

/**
 * Whole-lane band: a subdued wash, lighter than event bars.
 * Thin vertical grids sit on top; no glow panel.
 */
export function laneBand(
  category: string,
  hueOverride?: number,
): LaneSwatch {
  const base = baseFor(category, hueOverride);
  return {
    background: `light-dark(${hsl(base.h, Math.max(8, base.s - 6), 95.6)}, ${hsl(base.h, Math.max(8, base.s - 4), 16.5)})`,
    border: `light-dark(${hsl(base.h, base.s - 4, 88)}, ${hsl(base.h, base.s, 24)})`,
  };
}

/**
 * Stable per-event tint from the lane hue + event id hash.
 * A bit darker than the row in light mode so bars read as content.
 * Uses light-dark() so dark mode keeps AA contrast without a JS theme hook.
 */
export function eventSwatch(
  category: string,
  id: string,
  selected = false,
  hueOverride?: number,
): EventSwatch {
  const base = baseFor(category, hueOverride);
  const n = hashId(id);
  const hue = base.h + ((n % 5) - 2);
  const sat = base.s + ((n >> 3) % 3);
  const lightStep = n % 7;
  const lightL = selected ? 72 - lightStep * 0.8 : 82 - lightStep * 1.1;
  const darkL = selected ? 36 + lightStep * 0.5 : 28 + lightStep * 0.8;
  const lightBorder = selected ? 56 : 68 - lightStep;
  const darkBorder = selected ? 50 : 40 + lightStep * 0.5;

  return {
    background: `light-dark(${hsl(hue, sat, lightL)}, ${hsl(hue, sat + 2, darkL)})`,
    border: `light-dark(${hsl(hue, sat + 4, lightBorder)}, ${hsl(hue, sat + 4, darkBorder)})`,
    color: "light-dark(#1d1d1f, #f5f5f7)",
  };
}

export function hueSwatch(hue: number) {
  const h = ((hue % 360) + 360) % 360;
  return {
    background: `light-dark(${hsl(h, 16, 82)}, ${hsl(h, 16, 28)})`,
    border: `light-dark(${hsl(h, 18, 66)}, ${hsl(h, 16, 42)})`,
  };
}
