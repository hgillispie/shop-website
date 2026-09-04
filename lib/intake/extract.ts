import "server-only";
import type { IntakeExtraction } from "@/lib/db/schema";
import { coerceExtraction } from "@/lib/intake/fields";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_IMAGES = 5;

const SYSTEM_PROMPT = `You extract repair-shop CRM fields from iMessage/SMS/WhatsApp screenshots and any accompanying email text.

Return JSON only with these keys:
- customerName: string | null
- phone: string | null
- email: string | null
- bikeYearMakeModel: string | null
- workNeeded: string | null
- conversationSummary: string | null
- sentimentScore: number | null
- positiveQuotes: string[]
- negativeQuotes: string[]

Rules:
- Only use information visible in the images or email text. Never invent a name, phone, email, bike, or quote.
- phone should be the customer's number if it appears (contact header, message bubble, signature). Not the shop owner's number unless that is clearly the only number and labeled as the customer.
- bikeYearMakeModel like "2017 Harley Softail" when year/make/model (or any subset) is mentioned.
- workNeeded is what the customer wants done (symptoms, service, parts).
- conversationSummary is 2-5 sentences covering the thread.
- sentimentScore is 0–100 for how the customer feels about the shop/work (100 = delighted, 50 = mixed/unclear, 0 = upset). Null only if there is no customer conversation at all.
- positiveQuotes are verbatim customer sentences that praise the shop, the work, the owner, or the experience. Copy the customer's words. Never paraphrase. Never invent. Empty array if none. Skip short thanks ("thanks", "ok"). Prefer lines that could appear as a testimonial.
- negativeQuotes are verbatim customer sentences that complain, are frustrated, or unhappy. Copy the customer's words. Empty array if none.
- Use null when a field is not actually present. Arrays may be empty.`;

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
          ? "No screenshots were attached. Extract whatever you can from the email text."
          : `${input.imageUrls.length} screenshot(s) follow. Read the conversation bubbles, contact header, and any bike/work details.`,
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
      max_tokens: 1200,
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
