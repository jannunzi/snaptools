import type { HistoryCategoryId } from "@/lib/history-timeline";

type HueBase = {
  h: number;
  s: number;
};

/** Muted, desaturated bases — Apple-clean, not candy. */
const CATEGORY_HUE: Record<HistoryCategoryId, HueBase> = {
  empires: { h: 32, s: 16 },
  inventions: { h: 210, s: 10 },
  musicians: { h: 322, s: 12 },
  wars: { h: 10, s: 14 },
  explorations: { h: 92, s: 11 },
  science: { h: 206, s: 12 },
  art: { h: 36, s: 14 },
  sports: { h: 112, s: 10 },
};

export type EventSwatch = {
  background: string;
  border: string;
  color: string;
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
    return { h: ((hueOverride % 360) + 360) % 360, s: 12 };
  }
  if (category in CATEGORY_HUE) {
    return CATEGORY_HUE[category as HistoryCategoryId];
  }
  const n = hashId(category);
  return { h: n % 360, s: 11 };
}

/**
 * Stable per-event tint from the category hue + event id hash.
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
  const lightL = selected ? 74 - lightStep : 86 - lightStep * 1.4;
  const darkL = selected ? 34 + lightStep * 0.6 : 26 + lightStep * 0.9;
  const lightBorder = selected ? 58 : 70 - lightStep;
  const darkBorder = selected ? 48 : 38 + lightStep * 0.5;

  return {
    background: `light-dark(${hsl(hue, sat, lightL)}, ${hsl(hue, sat + 2, darkL)})`,
    border: `light-dark(${hsl(hue, sat + 4, lightBorder)}, ${hsl(hue, sat + 4, darkBorder)})`,
    color: "light-dark(#1d1d1f, #f5f5f7)",
  };
}

export function hueSwatch(hue: number) {
  const h = ((hue % 360) + 360) % 360;
  return {
    background: `light-dark(${hsl(h, 12, 82)}, ${hsl(h, 14, 28)})`,
    border: `light-dark(${hsl(h, 14, 68)}, ${hsl(h, 14, 42)})`,
  };
}
