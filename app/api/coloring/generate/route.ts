import { NextResponse } from "next/server";
import {
  coloringCategories,
  coloringPrompt,
  randomSubject,
  type ColoringCategory,
} from "@/lib/coloring-pages";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getXaiApiKey, XAI_IMAGE_MODEL, xaiHeaders, xaiUrl } from "@/lib/xai";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CATEGORIES = new Set(coloringCategories.map((item) => item.id));

type ImagineImage = {
  b64_json?: string | null;
  url?: string | null;
  mime_type?: string | null;
};

export async function GET() {
  return NextResponse.json({ available: Boolean(getXaiApiKey()) });
}

export async function POST(request: Request) {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY is not configured", fallback: true },
      { status: 503 },
    );
  }

  if (!rateLimit(`coloring:${clientKey(request)}`, 4, 120_000)) {
    return NextResponse.json(
      { error: "Please wait a moment before generating another page." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const categoryRaw =
    typeof body === "object" && body && "category" in body
      ? String((body as { category: unknown }).category ?? "animals")
      : "animals";
  const category = (
    CATEGORIES.has(categoryRaw as ColoringCategory) ? categoryRaw : "animals"
  ) as ColoringCategory;

  const subjectRaw =
    typeof body === "object" && body && "subject" in body
      ? String((body as { subject: unknown }).subject ?? "").trim()
      : "";
  const subject = subjectRaw.slice(0, 160) || randomSubject(category);
  const prompt = coloringPrompt(subject);

  const upstream = await fetch(xaiUrl("/images/generations"), {
    method: "POST",
    headers: xaiHeaders(apiKey),
    body: JSON.stringify({
      model: XAI_IMAGE_MODEL,
      prompt,
      n: 1,
      aspect_ratio: "3:4",
      resolution: "1k",
      quality: "medium",
      response_format: "b64_json",
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: "xAI Imagine request failed",
        status: upstream.status,
        detail: detail.slice(0, 400),
      },
      { status: 502 },
    );
  }

  const payload = (await upstream.json()) as { data?: ImagineImage[] };
  const image = payload.data?.[0];
  const bytes = await resolveImageBytes(image);
  if (!bytes) {
    return NextResponse.json({ error: "Imagine returned no image." }, { status: 502 });
  }

  const mime = image?.mime_type || "image/png";
  return NextResponse.json({
    id: `generated-${Date.now()}`,
    title: "New page",
    category,
    mime,
    image: `data:${mime};base64,${bytes}`,
  });
}

async function resolveImageBytes(image: ImagineImage | undefined) {
  if (!image) return null;
  if (image.b64_json) return image.b64_json;
  if (!image.url) return null;
  const res = await fetch(image.url, { cache: "no-store" });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer.toString("base64");
}
