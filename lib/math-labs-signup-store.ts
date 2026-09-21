import type { Collection, Db } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import type { MathLabSignup } from "@/lib/math-labs-signup";

/**
 * Where a Math Labs signup lands:
 * 1. POST JSON to MATH_LABS_SIGNUP_WEBHOOK when that https URL is set.
 *    hooks.slack.com receives `{ text }`. Other endpoints receive
 *    `{ email, interest, message, source, createdAt }`.
 * 2. Insert into MongoDB `math_lab_signups` when MONGODB_URI is already set.
 * 3. Always print a `[math-labs-signup]` line. That log is the inbox when
 *    neither store is configured. The build does not read the webhook env var.
 */

export const MATH_LAB_SIGNUPS_COLLECTION = "math_lab_signups";
export const MATH_LABS_SIGNUP_WEBHOOK_ENV = "MATH_LABS_SIGNUP_WEBHOOK";
const SIGNUP_SOURCE = "facts-tools-math-labs";
const LOG_PREFIX = "[math-labs-signup]";

type SignupRecord = {
  email: string;
  interest: string;
  source: typeof SIGNUP_SOURCE;
  createdAt: Date;
};

let indexReady: Promise<void> | null = null;

function readWebhook():
  | { kind: "unset" }
  | { kind: "invalid" }
  | { kind: "url"; url: string; slack: boolean } {
  const raw = process.env[MATH_LABS_SIGNUP_WEBHOOK_ENV]?.trim() ?? "";
  if (!raw) return { kind: "unset" };
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return { kind: "invalid" };
    return {
      kind: "url",
      url: url.toString(),
      slack: url.hostname === "hooks.slack.com",
    };
  } catch {
    return { kind: "invalid" };
  }
}

function webhookPayload(signup: MathLabSignup, createdAt: Date, slack: boolean) {
  if (slack) {
    const note = signup.interest || "(no note)";
    return {
      text: `Math Labs signup\n${signup.email}\n${note}`,
    };
  }
  return {
    email: signup.email,
    interest: signup.interest,
    message: signup.interest || "(no note)",
    source: SIGNUP_SOURCE,
    createdAt: createdAt.toISOString(),
  };
}

async function postWebhook(
  url: string,
  signup: MathLabSignup,
  createdAt: Date,
  slack: boolean,
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(webhookPayload(signup, createdAt, slack)),
    signal: AbortSignal.timeout(8000),
  });
  return response.ok;
}

async function signupsCollection(db: Db) {
  const collection: Collection<SignupRecord> = db.collection(
    MATH_LAB_SIGNUPS_COLLECTION,
  );
  if (!indexReady) {
    indexReady = collection
      .createIndex({ createdAt: -1 }, { name: "created_at" })
      .then(() => undefined);
  }
  try {
    await indexReady;
  } catch {
    indexReady = null;
  }
  return collection;
}

async function saveToDatabase(signup: MathLabSignup, createdAt: Date) {
  const db = await getMongoDb();
  if (!db) return false;
  const collection = await signupsCollection(db);
  await collection.insertOne({
    email: signup.email,
    interest: signup.interest,
    source: SIGNUP_SOURCE,
    createdAt,
  });
  return true;
}

export async function storeMathLabSignup(signup: MathLabSignup) {
  const createdAt = new Date();
  const webhook = readWebhook();
  const destinations: string[] = [];

  const webhookAttempt =
    webhook.kind === "url"
      ? postWebhook(webhook.url, signup, createdAt, webhook.slack)
          .then((ok) => {
            if (ok) destinations.push("webhook");
            else {
              console.error(
                `${LOG_PREFIX} Webhook delivery failed. The signup is still in this log.`,
              );
            }
          })
          .catch(() => {
            console.error(
              `${LOG_PREFIX} Webhook delivery failed. The signup is still in this log.`,
            );
          })
      : Promise.resolve();

  const databaseAttempt = saveToDatabase(signup, createdAt)
    .then((saved) => {
      if (saved) destinations.push("database");
    })
    .catch((error: unknown) => {
      console.error(`${LOG_PREFIX} Database write failed.`, error);
    });

  await Promise.all([webhookAttempt, databaseAttempt]);

  if (webhook.kind === "invalid") {
    console.warn(
      `${LOG_PREFIX} ${MATH_LABS_SIGNUP_WEBHOOK_ENV} is set but is not an https URL. Signup queued in this log.`,
    );
  }

  destinations.push("log");
  console.info(
    LOG_PREFIX,
    JSON.stringify({
      at: createdAt.toISOString(),
      destinations,
      email: signup.email,
      interest: signup.interest,
    }),
  );

  return { destinations };
}
