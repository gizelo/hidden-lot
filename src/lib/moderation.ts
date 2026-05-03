import { openai } from "./openai";

// Phone: 7+ digits connected by short non-letter separators (spaces, |, /, \, -, (), etc.)
const PHONE_RE = /(?:\d[^A-Za-z\d]{0,3}){6,}\d/;
// URLs with protocol or www, or common TLDs on word boundaries
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9][a-z0-9-]*\.(?:com|net|org|io|app|co|ru|de|uk|shop|store|me|biz|info|xyz|online|site|link)\b/i;
const EMAIL_RE = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;
// Social / messenger handles
const HANDLE_RE = /(?:^|\s)@[\w.]{3,}/;

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

const LLM_PROMPT = `You are a strict content moderator for a second-hand product marketplace. The input is a product listing (title + description) written by a user.

Decide whether the text is ONLY a factual description of the item being sold. Reject otherwise.

REJECT if the text contains ANY of the following (even obfuscated, leetspeak, or partially masked):
1. Contact info — phone numbers (including word-form "call six nine six"), emails, URLs, postal addresses, social handles, mentions of Telegram/WhatsApp/Instagram/etc.
2. References to drugs, controlled substances, weapons, or illegal services (e.g. "drgs", "dr0gs", "w33d", "pills for sale", "grm", "meth").
3. Calls to action or promotional phrasing: "call me", "DM me", "buy now at…", "visit our site", "contact us".
4. Profanity, hate speech, threats, harassment, or sexual content.
5. Anything off-topic — personal stories, unrelated commentary, advertising for other items or platforms.

ACCEPT only if the text exclusively describes the item: what it is, brand/model, specs, materials, size, condition, plausibly visible history.

Return STRICT JSON, no prose:
{"ok": true}
or
{"ok": false, "reason": "<one short user-facing sentence telling the seller what to fix>"}

Examples of good reasons:
- "Remove the phone number from your description."
- "Remove references to drugs or illegal substances."
- "Keep the description focused on the item — no links or contact info."
- "Remove calls to action — buyers contact you through the platform."`;

export async function moderateListingText(
  title: string,
  description: string
): Promise<ModerationResult> {
  const combined = `${title}\n${description}`;

  // Layer 1 — fast regex for obvious violations. Short-circuit so we don't hit the LLM.
  if (PHONE_RE.test(combined)) {
    return {
      ok: false,
      reason: "Please remove phone numbers — contact happens through the platform.",
    };
  }
  if (EMAIL_RE.test(combined)) {
    return {
      ok: false,
      reason: "Please remove email addresses — contact happens through the platform.",
    };
  }
  if (URL_RE.test(combined)) {
    return {
      ok: false,
      reason: "Please remove links — external URLs aren't allowed in listings.",
    };
  }
  if (HANDLE_RE.test(combined)) {
    return {
      ok: false,
      reason: "Please remove social handles — contact happens through the platform.",
    };
  }

  // Layer 2 — semantic LLM check. Always runs after regex passes.
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: LLM_PROMPT },
        { role: "user", content: `TITLE: ${title}\n\nDESCRIPTION: ${description}` },
      ],
      max_tokens: 120,
      temperature: 0,
    });

    const raw = JSON.parse(response.choices[0].message.content ?? "{}");
    if (raw.ok === false) {
      const reason = String(raw.reason || "Your text contains content that isn't allowed.").slice(0, 200);
      return { ok: false, reason };
    }
  } catch (err) {
    // Fail-open: regex already caught the obvious stuff. Log for visibility.
    console.error("[moderation] LLM check failed:", err);
  }

  return { ok: true };
}
