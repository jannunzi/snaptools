import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { parseMathLabSignup } from "@/lib/math-labs-signup";
import { storeMathLabSignup } from "@/lib/math-labs-signup-store";

export const dynamic = "force-dynamic";

const LIMIT = 5;
const WINDOW_MS = 10 * 60_000;

export async function POST(request: Request) {
  if (!rateLimit(`math-labs-signup:${clientKey(request)}`, LIMIT, WINDOW_MS)) {
    return NextResponse.json(
      { ok: false, error: "Too many notes. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "That note didn't come through." },
      { status: 400 },
    );
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "That note didn't come through." },
      { status: 400 },
    );
  }

  const record = body as { email?: unknown; interest?: unknown; website?: unknown };
  if (typeof record.website === "string" && record.website.trim()) {
    return NextResponse.json({ ok: true });
  }

  const parsed = parseMathLabSignup(record);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 },
    );
  }

  try {
    await storeMathLabSignup(parsed.signup);
  } catch (error) {
    console.error("[math-labs-signup] Could not store signup.", error);
    return NextResponse.json(
      {
        ok: false,
        error: "We couldn't save that just now. Try again in a moment.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
