"use client";

import { useState, type FormEvent } from "react";
import {
  MATH_LAB_SIGNUP_CHIPS,
  MATH_LAB_SIGNUP_INTEREST_MAX,
  signupChipSelected,
  toggleSignupChip,
} from "@/lib/math-labs-signup";

const CTA = "Classroom math labs — new tools + tell us what to build.";

export function MathLabsSignup() {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/math-labs/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, interest, website }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "We couldn't save that just now. Try again in a moment.");
        return;
      }
      setDone(true);
    } catch {
      setError("We couldn't save that just now. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="signup"
      aria-labelledby="math-labs-signup-heading"
      className="mt-20 scroll-mt-24"
    >
      <div className="snap-panel sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-muted">
          For teachers
        </p>
        <h2
          id="math-labs-signup-heading"
          className="mt-3 max-w-2xl font-display text-3xl leading-[1.15] text-ink sm:text-4xl"
        >
          {CTA}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
          Free. An email, and an optional note about the lab you want next.
          The tools stay open with no account.
        </p>

        {done ? (
          <p role="status" className="mt-8 text-lg leading-relaxed text-ink">
            Thanks. We&apos;ll read this when we plan the next lab.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="relative mt-8 max-w-xl" noValidate>
            <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-ink" htmlFor="math-labs-email">
              Email
            </label>
            <input
              id="math-labs-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="snap-input mt-2"
            />

            <div className="mt-6">
              <label className="block text-sm font-medium text-ink" htmlFor="math-labs-interest">
                What would you like next?
              </label>
              <p className="mt-1 text-sm text-ink-muted">Optional. A topic fills the note.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {MATH_LAB_SIGNUP_CHIPS.map((chip) => {
                  const pressed = signupChipSelected(interest, chip.label);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      aria-pressed={pressed}
                      onClick={() =>
                        setInterest((current) => toggleSignupChip(current, chip.label))
                      }
                      className={`inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-medium transition-colors ${
                        pressed
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-line bg-transparent text-ink hover:border-ink"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                id="math-labs-interest"
                name="interest"
                rows={3}
                maxLength={MATH_LAB_SIGNUP_INTEREST_MAX}
                value={interest}
                onChange={(event) => setInterest(event.target.value)}
                placeholder="A lab you'd use with your class"
                className="snap-input mt-3 min-h-28 resize-y py-3 leading-relaxed"
              />
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm text-bad">
                {error}
              </p>
            ) : null}

            <button type="submit" className="snap-btn mt-6 w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
