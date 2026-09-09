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
const GENERATE_LIMIT = 4;
const GENERATE_WINDOW_MS = 120_000;

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

  if (!rateLimit(`coloring:${clientKey(request)}`, GENERATE_LIMIT, GENERATE_WINDOW_MS)) {
    return NextResponse.json(
      {
        error: `You can generate ${GENERATE_LIMIT} pages every 2 minutes. Please wait and try again.`,
      },
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

  let upstream: Response;
  try {
    upstream = await requestImagine(apiKey, prompt, "url");
    if (!upstream.ok && (upstream.status === 400 || upstream.status === 422)) {
      upstream = await requestImagine(apiKey, prompt, "b64_json");
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not reach image generation. Please try again.",
        detail: error instanceof Error ? error.message.slice(0, 200) : "",
      },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    const rateLimited = upstream.status === 429;
    return NextResponse.json(
      {
        error: rateLimited
          ? "Image generation is rate-limited right now. Please wait and try again."
          : "Could not generate a page. Please try again.",
        status: upstream.status,
        detail: detail.slice(0, 400),
      },
      { status: rateLimited ? 429 : 502 },
    );
  }

  let payload: { data?: ImagineImage[] };
  try {
    payload = (await upstream.json()) as { data?: ImagineImage[] };
  } catch {
    return NextResponse.json(
      { error: "Imagine returned an unreadable response." },
      { status: 502 },
    );
  }

  const image = payload.data?.[0];
  const resolved = await resolveGeneratedImage(image);
  if (!resolved) {
    return NextResponse.json({ error: "Imagine returned no image." }, { status: 502 });
  }

  return NextResponse.json({
    id: `generated-${Date.now()}`,
    title: "New page",
    category,
    mime: resolved.mime,
    image: resolved.image,
    sessionOnly: true,
  });
}

function requestImagine(
  apiKey: string,
  prompt: string,
  responseFormat: "url" | "b64_json",
) {
  return fetch(xaiUrl("/images/generations"), {
    method: "POST",
    headers: xaiHeaders(apiKey),
    body: JSON.stringify({
      model: XAI_IMAGE_MODEL,
      prompt,
      n: 1,
      aspect_ratio: "3:4",
      resolution: "1k",
      quality: "medium",
      response_format: responseFormat,
    }),
    cache: "no-store",
  });
}

async function resolveGeneratedImage(image: ImagineImage | undefined) {
  if (!image) return null;
  const mime = image.mime_type || "image/png";
  // Session-only data URL so the coloring canvas can flood-fill without CORS.
  // Imagine `url` is preferred over asking the model for a giant b64_json body.
  if (image.url) {
    const res = await fetch(image.url, { cache: "no-store" });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      const detected = res.headers.get("content-type") || mime;
      return {
        image: `data:${detected};base64,${buffer.toString("base64")}`,
        mime: detected,
      };
    }
  }
  if (image.b64_json) {
    return { image: `data:${mime};base64,${image.b64_json}`, mime };
  }
  return null;
}
