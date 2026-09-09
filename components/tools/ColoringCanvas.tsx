"use client";

import { useCallback, useEffect, useRef, type PointerEvent } from "react";

type ColoringCanvasProps = {
  src: string;
  color: string;
  revision: number;
  onReadyChange?: (ready: boolean) => void;
};

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : value;
  const num = Number.parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance(r: number, g: number, b: number) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function thresholdLineArt(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cutoff = 92,
) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = luminance(data[i], data[i + 1], data[i + 2]);
    if (lum < cutoff) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 255;
    } else {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fill: [number, number, number],
) {
  const { width, height } = ctx.canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const index = (x: number, y: number) => (y * width + x) * 4;

  if (startX < 0 || startY < 0 || startX >= width || startY >= height) return;

  const start = index(startX, startY);
  const sr = data[start];
  const sg = data[start + 1];
  const sb = data[start + 2];
  if (luminance(sr, sg, sb) < 80) return;
  if (sr === fill[0] && sg === fill[1] && sb === fill[2]) return;

  const sameRegion = (i: number) => {
    if (luminance(data[i], data[i + 1], data[i + 2]) < 80) return false;
    return (
      Math.abs(data[i] - sr) +
        Math.abs(data[i + 1] - sg) +
        Math.abs(data[i + 2] - sb) <
      48
    );
  };

  const stack: Array<[number, number]> = [[startX, startY]];
  while (stack.length) {
    const next = stack.pop();
    if (!next) break;
    const [x, y] = next;
    if (!sameRegion(index(x, y))) continue;

    let left = x;
    while (left > 0 && sameRegion(index(left - 1, y))) left -= 1;
    let right = x;
    while (right < width - 1 && sameRegion(index(right + 1, y))) right += 1;

    for (let cx = left; cx <= right; cx += 1) {
      const i = index(cx, y);
      data[i] = fill[0];
      data[i + 1] = fill[1];
      data[i + 2] = fill[2];
      data[i + 3] = 255;
      if (y > 0 && sameRegion(index(cx, y - 1))) stack.push([cx, y - 1]);
      if (y < height - 1 && sameRegion(index(cx, y + 1))) stack.push([cx, y + 1]);
    }
  }

  ctx.putImageData(image, 0, 0);
}

export function ColoringCanvas({
  src,
  color,
  revision,
  onReadyChange,
}: ColoringCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef(color);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let cancelled = false;
    onReadyChange?.(false);

    const image = new Image();
    if (/^https?:\/\//i.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.decoding = "async";
    image.onload = () => {
      if (cancelled) return;
      const width = image.naturalWidth || 768;
      const height = image.naturalHeight || 1024;
      canvas.width = width;
      canvas.height = height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0, width, height);
      thresholdLineArt(ctx, width, height);
      onReadyChange?.(true);
    };
    image.onerror = () => {
      if (!cancelled) onReadyChange?.(false);
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [onReadyChange, revision, src]);

  const paint = useCallback((event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    floodFill(ctx, x, y, hexToRgb(colorRef.current));
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={paint}
      className="mx-auto block h-auto w-full max-w-[28rem] cursor-crosshair touch-none bg-white"
      aria-label="Coloring page. Tap a region to fill it."
    />
  );
}

export function findColoringCanvas(root: HTMLElement | null) {
  return root?.querySelector("canvas") ?? null;
}
