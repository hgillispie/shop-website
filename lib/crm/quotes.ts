import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { customerQuotes, type QuoteSentiment } from "@/lib/db/schema";
import { isUsableQuote, normalizeQuote } from "@/lib/intake/fields";

export async function saveExtractedQuotes(input: {
  customerId: string;
  intakeDraftId?: string | null;
  source?: string;
  positiveQuotes: string[];
  negativeQuotes: string[];
}) {
  const existing = await db.query.customerQuotes.findMany({
    where: eq(customerQuotes.customerId, input.customerId),
  });
  const seen = new Set(existing.map((row) => row.normalizedQuote));

  const incoming: Array<{ quote: string; sentiment: (typeof customerQuotes.$inferInsert)["sentiment"] }> = [
    ...input.positiveQuotes.map((quote) => ({ quote, sentiment: "positive" as const })),
    ...input.negativeQuotes.map((quote) => ({ quote, sentiment: "negative" as const })),
  ];

  for (const item of incoming) {
    const cleaned = item.quote.replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "").trim();
    if (!isUsableQuote(cleaned)) continue;
    const normalizedQuote = normalizeQuote(cleaned);
    if (!normalizedQuote || seen.has(normalizedQuote)) continue;
    seen.add(normalizedQuote);
    await db.insert(customerQuotes).values({
      customerId: input.customerId,
      intakeDraftId: input.intakeDraftId ?? null,
      quote: cleaned,
      normalizedQuote,
      sentiment: item.sentiment,
      source: input.source ?? "intake",
    });
  }
}

export async function addManualQuote(input: {
  customerId: string;
  quote: string;
  sentiment: QuoteSentiment;
}) {
  await saveExtractedQuotes({
    customerId: input.customerId,
    source: "manual",
    positiveQuotes: input.sentiment === "positive" ? [input.quote] : [],
    negativeQuotes: input.sentiment === "negative" ? [input.quote] : [],
  });
}
