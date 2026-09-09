#!/usr/bin/env node
/**
 * Pre-generate the coloring starter pack with xAI Grok Imagine.
 *
 *   XAI_API_KEY=... npm run generate:coloring
 *
 * Writes PNGs to public/coloring/ and flips `temporary` in the stamp file.
 * Safe to re-run; existing files are overwritten.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "coloring");
const MODEL = "grok-imagine-image-2.0";
const API = "https://api.x.ai/v1/images/generations";

const LINE_ART =
  "Black-and-white coloring book page for children. Clean black outlines on a pure white background. Thick kid-friendly contour lines, closed shapes that are easy to color in. No gray shading, no hatching, no gradients, no drop shadows. No large filled black regions that block coloring (tiny eye pupils are OK). No text, letters, numbers, captions, signatures, watermarks, or logos. No licensed, trademarked, or copyrighted characters. Original generic design, centered, printable portrait composition. Simple decorative details, not photorealistic.";

const PAGES = [
  ["cat", "A friendly sitting house cat with whiskers, a striped tail, and a ball of yarn."],
  ["fish", "A cheerful tropical fish with large fins, empty outlined scales, bubbles, and seaweed."],
  ["butterfly", "A butterfly with large patterned wings made of empty outlined cells, beside a flower."],
  ["owl", "A perched owl on a branch with big round outlined eyes and empty feather shapes."],
  ["mandala-petals", "A circular flower mandala with many empty petal rings and geometric cells."],
  ["mandala-star", "A geometric star mandala with an eight-point star, concentric rings, and empty cells."],
  ["castle", "A fairy-tale castle with towers, empty window shapes, a gate, and simple clouds."],
  ["dragon", "A friendly cute garden dragon with wings and empty outlined belly scales among flowers."],
  ["dinosaur", "A friendly smiling stegosaurus with empty outlined back plates and simple plants."],
  ["tree", "A large shade tree with a thick trunk, empty outlined leaf clusters, grass, and a bird."],
  ["flower", "A big sunflower with empty petals, an outlined seed center, stem, leaves, and a butterfly."],
  ["sailboat", "A sailboat with two empty outlined sails, a hull, waves, a sun, and a seagull."],
];

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const text = readFileSyncSafe(file);
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function readFileSyncSafe(file) {
  return readFileSync(file, "utf8");
}

async function generateOne(apiKey, id, subject) {
  const prompt = `${LINE_ART} Subject: ${subject}`;
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      n: 1,
      aspect_ratio: "3:4",
      resolution: "1k",
      quality: "medium",
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${id}: ${res.status} ${detail.slice(0, 400)}`);
  }

  const payload = await res.json();
  const image = payload.data?.[0];
  let bytes;
  if (image?.b64_json) {
    bytes = Buffer.from(image.b64_json, "base64");
  } else if (image?.url) {
    const file = await fetch(image.url);
    if (!file.ok) throw new Error(`${id}: failed to download ${image.url}`);
    bytes = Buffer.from(await file.arrayBuffer());
  } else {
    throw new Error(`${id}: no image in response`);
  }

  const dest = path.join(OUT_DIR, `${id}.png`);
  await writeFile(dest, bytes);
  console.log(`wrote ${path.relative(ROOT, dest)} (${bytes.length} bytes)`);
}

async function main() {
  loadEnvFile(path.join(ROOT, ".env.local"));
  loadEnvFile(path.join(ROOT, ".env"));

  const apiKey = process.env.XAI_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "XAI_API_KEY is missing. Add it to .env.local or the environment, then re-run:\n  npm run generate:coloring",
    );
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const only = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const pages = only.length
    ? PAGES.filter(([id]) => only.includes(id))
    : PAGES;

  if (!pages.length) {
    console.error(`No matching pages. Known ids: ${PAGES.map(([id]) => id).join(", ")}`);
    process.exit(1);
  }

  for (const [id, subject] of pages) {
    process.stdout.write(`Generating ${id}… `);
    await generateOne(apiKey, id, subject);
  }

  await writeFile(
    path.join(OUT_DIR, "generated.json"),
    JSON.stringify(
      {
        source: "grok-imagine-image-2.0",
        generatedAt: new Date().toISOString(),
        temporary: false,
        pages: pages.map(([id]) => id),
      },
      null,
      2,
    ),
  );
  console.log("Done. Starter pack written to public/coloring/.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
