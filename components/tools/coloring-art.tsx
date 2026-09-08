import type { ReactNode } from "react";

export type ColorRegionProps = {
  fills: Record<string, string>;
  onFill: (id: string) => void;
};

function region(
  id: string,
  fills: Record<string, string>,
  onFill: (id: string) => void,
) {
  return {
    fill: fills[id] ?? "#ffffff",
    stroke: "currentColor",
    strokeWidth: 2.4,
    strokeLinejoin: "round" as const,
    className: "cursor-pointer",
    role: "button" as const,
    tabIndex: 0,
    "aria-label": `Color region ${id}`,
    onClick: (event: { stopPropagation: () => void }) => {
      event.stopPropagation();
      onFill(id);
    },
    onKeyDown: (event: { key: string; preventDefault: () => void }) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onFill(id);
      }
    },
  };
}

export function CatArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 240 260" className="h-auto w-full text-ink">
      <ellipse cx="120" cy="168" rx="62" ry="52" {...r("body")} />
      <ellipse cx="120" cy="176" rx="34" ry="28" {...r("belly")} />
      <circle cx="120" cy="92" r="46" {...r("head")} />
      <path d="M78 70 L70 28 L108 62 Z" {...r("earL")} />
      <path d="M162 70 L170 28 L132 62 Z" {...r("earR")} />
      <path d="M178 168 C210 150 222 196 198 214 C186 200 176 190 170 176 Z" {...r("tail")} />
      <ellipse cx="104" cy="88" rx="8" ry="10" {...r("eyeL")} />
      <ellipse cx="136" cy="88" rx="8" ry="10" {...r("eyeR")} />
      <path d="M120 102 L110 112 L130 112 Z" {...r("nose")} />
    </svg>
  );
}

export function FishArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 260 180" className="h-auto w-full text-ink">
      <ellipse cx="120" cy="90" rx="78" ry="44" {...r("body")} />
      <path d="M196 90 L244 52 L228 90 L244 128 Z" {...r("tail")} />
      <path d="M110 52 L132 24 L150 54 Z" {...r("finTop")} />
      <path d="M118 128 L138 158 L156 126 Z" {...r("finBot")} />
      <ellipse cx="86" cy="82" rx="10" ry="12" {...r("eye")} />
      <path d="M70 98 C78 108 92 110 102 102" fill="none" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}

export function ButterflyArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 260 220" className="h-auto w-full text-ink">
      <ellipse cx="130" cy="110" rx="10" ry="54" {...r("body")} />
      <circle cx="130" cy="52" r="12" {...r("head")} />
      <path d="M120 44 C104 18 86 16 78 28" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M140 44 C156 18 174 16 182 28" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <path d="M122 78 C60 20 18 70 70 118 C92 130 118 112 122 96 Z" {...r("wingUL")} />
      <path d="M138 78 C200 20 242 70 190 118 C168 130 142 112 138 96 Z" {...r("wingUR")} />
      <path d="M122 122 C54 130 40 190 96 186 C114 176 122 150 122 136 Z" {...r("wingLL")} />
      <path d="M138 122 C206 130 220 190 164 186 C146 176 138 150 138 136 Z" {...r("wingLR")} />
      <circle cx="88" cy="82" r="14" {...r("spotL")} />
      <circle cx="172" cy="82" r="14" {...r("spotR")} />
    </svg>
  );
}

export function OwlArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 220 250" className="h-auto w-full text-ink">
      <ellipse cx="110" cy="150" rx="70" ry="78" {...r("body")} />
      <circle cx="110" cy="88" r="54" {...r("head")} />
      <path d="M60 54 L78 18 L98 58 Z" {...r("earL")} />
      <path d="M160 54 L142 18 L122 58 Z" {...r("earR")} />
      <circle cx="86" cy="88" r="22" {...r("eyeL")} />
      <circle cx="134" cy="88" r="22" {...r("eyeR")} />
      <circle cx="86" cy="88" r="8" {...r("pupilL")} />
      <circle cx="134" cy="88" r="8" {...r("pupilR")} />
      <path d="M110 102 L98 118 L122 118 Z" {...r("beak")} />
      <ellipse cx="110" cy="168" rx="36" ry="28" {...r("belly")} />
      <path d="M78 214 L96 228 L110 212 L124 228 L142 214" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function petalRing(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  count: number,
) {
  const step = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const a = i * step;
    const [x1, y1] = polar(cx, cy, inner, a);
    const [x2, y2] = polar(cx, cy, outer, a + step / 2);
    const [x3, y3] = polar(cx, cy, inner, a + step);
    return `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3} Z`;
  });
}

export function MandalaPetalsArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  const outer = petalRing(130, 130, 58, 118, 12);
  const mid = petalRing(130, 130, 34, 72, 8);
  return (
    <svg viewBox="0 0 260 260" className="h-auto w-full text-ink">
      <circle cx="130" cy="130" r="122" {...r("rim")} />
      {outer.map((d, i) => (
        <path key={`o${i}`} d={d} {...r(`outer${i}`)} />
      ))}
      {mid.map((d, i) => (
        <path key={`m${i}`} d={d} {...r(`mid${i}`)} />
      ))}
      <circle cx="130" cy="130" r="28" {...r("core")} />
    </svg>
  );
}

export function MandalaStarArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  const points = Array.from({ length: 8 }, (_, i) => {
    const [x, y] = polar(130, 130, i % 2 === 0 ? 108 : 52, i * 45);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 260 260" className="h-auto w-full text-ink">
      <circle cx="130" cy="130" r="124" {...r("disc")} />
      <polygon points={points} {...r("star")} />
      <circle cx="130" cy="130" r="40" {...r("ring")} />
      <circle cx="130" cy="130" r="18" {...r("dot")} />
    </svg>
  );
}

export function CastleArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 280 240" className="h-auto w-full text-ink">
      <rect x="20" y="150" width="240" height="70" {...r("wall")} />
      <rect x="30" y="80" width="50" height="140" {...r("towerL")} />
      <rect x="200" y="80" width="50" height="140" {...r("towerR")} />
      <rect x="100" y="108" width="80" height="112" {...r("keep")} />
      <path d="M24 80 L55 40 L86 80 Z" {...r("roofL")} />
      <path d="M194 80 L225 40 L256 80 Z" {...r("roofR")} />
      <path d="M96 108 L140 62 L184 108 Z" {...r("roofC")} />
      <rect x="126" y="168" width="28" height="52" {...r("door")} />
      <circle cx="55" cy="120" r="10" {...r("winL")} />
      <circle cx="225" cy="120" r="10" {...r("winR")} />
      <rect x="128" y="128" width="24" height="18" {...r("winC")} />
      <path d="M52 40 L52 22" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="M222 40 L222 22" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function DragonArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 280 220" className="h-auto w-full text-ink">
      <ellipse cx="150" cy="128" rx="70" ry="40" {...r("body")} />
      <path d="M210 128 C250 90 268 150 238 168 C224 150 214 140 206 132 Z" {...r("tail")} />
      <circle cx="86" cy="92" r="36" {...r("head")} />
      <path d="M58 78 L42 52 L78 70 Z" {...r("horn")} />
      <path d="M70 118 L36 128 L72 134 Z" {...r("snout")} />
      <path d="M128 104 C110 48 176 36 168 90 C154 78 140 90 128 104 Z" {...r("wing")} />
      <circle cx="96" cy="84" r="7" {...r("eye")} />
      <ellipse cx="150" cy="136" rx="28" ry="16" {...r("belly")} />
    </svg>
  );
}

export function TreeArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  return (
    <svg viewBox="0 0 240 260" className="h-auto w-full text-ink">
      <rect x="20" y="200" width="200" height="36" rx="8" {...r("ground")} />
      <rect x="104" y="130" width="32" height="80" {...r("trunk")} />
      <circle cx="120" cy="88" r="58" {...r("canopy")} />
      <circle cx="78" cy="110" r="36" {...r("leafL")} />
      <circle cx="162" cy="110" r="36" {...r("leafR")} />
      <circle cx="120" cy="54" r="28" {...r("leafTop")} />
    </svg>
  );
}

export function FlowerArt({ fills, onFill }: ColorRegionProps) {
  const r = (id: string) => region(id, fills, onFill);
  const petals = petalRing(120, 128, 22, 68, 8);
  return (
    <svg viewBox="0 0 240 260" className="h-auto w-full text-ink">
      <circle cx="188" cy="48" r="26" {...r("sun")} />
      <rect x="112" y="168" width="16" height="62" {...r("stem")} />
      <path d="M112 196 C70 176 64 220 104 214 Z" {...r("leafL")} />
      <path d="M128 200 C176 180 182 226 140 218 Z" {...r("leafR")} />
      {petals.map((d, i) => (
        <path key={i} d={d} {...r(`petal${i}`)} />
      ))}
      <circle cx="120" cy="128" r="18" {...r("center")} />
    </svg>
  );
}

export type ColoringCategory = "animals" | "mandalas" | "fantasy" | "nature";

export type ColoringPage = {
  id: string;
  title: string;
  category: ColoringCategory;
  render: (props: ColorRegionProps) => ReactNode;
};

export const coloringPages: ColoringPage[] = [
  { id: "cat", title: "Sitting cat", category: "animals", render: (p) => <CatArt {...p} /> },
  { id: "fish", title: "Fish", category: "animals", render: (p) => <FishArt {...p} /> },
  { id: "butterfly", title: "Butterfly", category: "animals", render: (p) => <ButterflyArt {...p} /> },
  { id: "owl", title: "Owl", category: "animals", render: (p) => <OwlArt {...p} /> },
  { id: "mandala-petals", title: "Petal mandala", category: "mandalas", render: (p) => <MandalaPetalsArt {...p} /> },
  { id: "mandala-star", title: "Star mandala", category: "mandalas", render: (p) => <MandalaStarArt {...p} /> },
  { id: "castle", title: "Castle", category: "fantasy", render: (p) => <CastleArt {...p} /> },
  { id: "dragon", title: "Garden dragon", category: "fantasy", render: (p) => <DragonArt {...p} /> },
  { id: "tree", title: "Shade tree", category: "nature", render: (p) => <TreeArt {...p} /> },
  { id: "flower", title: "Sunflower", category: "nature", render: (p) => <FlowerArt {...p} /> },
];

export const coloringCategories: { id: ColoringCategory; label: string }[] = [
  { id: "animals", label: "Animals" },
  { id: "mandalas", label: "Mandalas" },
  { id: "fantasy", label: "Fantasy" },
  { id: "nature", label: "Nature" },
];
