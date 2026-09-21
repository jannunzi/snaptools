/**
 * Teacher signup for Math Labs. Shared by the hub form and the route handler.
 * Storage lives in lib/math-labs-signup-store.ts so this file stays client-safe.
 */

export const MATH_LAB_SIGNUP_CHIPS = [
  { id: "fractions", label: "Fractions depth" },
  { id: "algebra", label: "Algebra graphs" },
  { id: "geometry", label: "Geometry proofs" },
  { id: "probability", label: "Probability" },
] as const;

export const MATH_LAB_SIGNUP_INTEREST_MAX = 400;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MathLabSignup = {
  email: string;
  interest: string;
};

export function parseMathLabSignup(
  input: { email?: unknown; interest?: unknown },
): { ok: true; signup: MathLabSignup } | { ok: false; error: string } {
  const email = String(input.email ?? "").trim().toLowerCase();
  const interest = String(input.interest ?? "").trim();

  if (!email) {
    return { ok: false, error: "Add an email so we can write you." };
  }
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "That email doesn't look complete." };
  }
  if (interest.length > MATH_LAB_SIGNUP_INTEREST_MAX) {
    return {
      ok: false,
      error: `Keep the note under ${MATH_LAB_SIGNUP_INTEREST_MAX} characters.`,
    };
  }

  return { ok: true, signup: { email, interest } };
}

export function splitSignupInterest(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function toggleSignupChip(current: string, label: string) {
  const parts = splitSignupInterest(current);
  const index = parts.findIndex(
    (part) => part.toLowerCase() === label.toLowerCase(),
  );
  if (index >= 0) {
    parts.splice(index, 1);
    return parts.join(", ");
  }
  return [...parts, label].join(", ");
}

export function signupChipSelected(current: string, label: string) {
  return splitSignupInterest(current).some(
    (part) => part.toLowerCase() === label.toLowerCase(),
  );
}
