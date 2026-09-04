import "server-only";
import type { IntakeExtraction } from "@/lib/db/schema";
import { coerceExtraction } from "@/lib/intake/fields";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "qwen/qwen3.6-27b";
const MAX_IMAGES = 5;

const SYSTEM_PROMPT = `You help a one-person motorcycle shop. The owner is a technician, not an office person. Read iMessage/SMS/WhatsApp screenshots plus any caption or email text, then return JSON only.

Keys:
- customerName: string | null
- phone: string | null
- email: string | null
- bikeYearMakeModel: string | null
- workNeeded: string | null
- conversationSummary: string | null
- sentimentScore: number | null
- positiveQuotes: string[]
- negativeQuotes: string[]
- ownerBrief: string | null
- recommendedNextStep: string | null
- urgency: "low" | "normal" | "high" | null
- missingInfo: string[]

Facts vs judgment:
- Never invent a name, phone, email, bike, or quote. If it is not visible, use null / [].
- phone is the customer's number if it appears in the header, a bubble, a signature, or the caption/email the shop owner typed. The owner often pastes the number in the caption because iMessage hides it. Do not use the shop's own number.
- email same rule — usually missing from texts; check the caption.
- bikeYearMakeModel like "2017 Harley Softail" when any subset is mentioned.
- workNeeded is the repair they want (symptoms, service, parts).
- conversationSummary is 2-5 factual sentences.
- sentimentScore is 0–100 for how they feel about the shop/work (100 delighted, 50 mixed, 0 upset). Null only if there is no customer conversation.
- positiveQuotes / negativeQuotes are verbatim customer sentences. Never paraphrase. Skip "thanks" / "ok".
- ownerBrief is the useful part: 3-6 sentences for the technician. What is going on, what they actually want, how they sound, anything that will bite him if he ignores it. Write like a shop foreman, not a CRM.
- recommendedNextStep is one concrete action (text a drop-off window, order a part, wait for a photo, call them back). Not "review the ticket".
- urgency: high = bike down / angry / safety; normal = typical shop work; low = curiosity or later.
- missingInfo is what he still needs (phone, year, VIN, photos of the leak). Empty if nothing important is missing.
- Use null when a field is not actually present.`;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function extractIntakeFromScreenshots(input: {
  bodyText: string;
  subject: string | null;
  imageUrls: string[];
}): Promise<IntakeExtraction | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[intake] GROQ_API_KEY is not set — skipping vision extraction.");
    return null;
  }

  const parts: ContentPart[] = [
    {
      type: "text",
      text: [
        input.subject ? `Email subject: ${input.subject}` : null,
        input.bodyText ? `Email body:\n${input.bodyText.slice(0, 4000)}` : "Email body: (empty)",
        input.imageUrls.length === 0
          ? "No screenshots were attached. Use the caption/email text."
          : `${input.imageUrls.length} screenshot(s) follow. Read bubbles, the contact header, and the owner's caption — the number is often only in the caption.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];

  for (const url of input.imageUrls.slice(0, MAX_IMAGES)) {
    parts.push({ type: "image_url", image_url: { url } });
  }

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      max_tokens: 1600,
      reasoning_effort: "none",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: parts },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error("[intake] Groq extraction failed:", response.status, errText.slice(0, 500));
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    return coerceExtraction(JSON.parse(content));
  } catch {
    console.error("[intake] Groq returned non-JSON content:", content.slice(0, 300));
    return null;
  }
}
