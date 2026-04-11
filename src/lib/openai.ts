import OpenAI from "openai";
import { CATEGORIES, RARITY_TIERS, type Category, type RarityTier } from "./constants";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface LotAnalysis {
  title: string;
  description: string;
  category: Category;
  suggestedPriceCents: number;
  rarity: RarityTier;
  rarityReasoning: string;
}

const ANALYSIS_PROMPT = `You are a listing assistant for a casual auction marketplace. Analyze the photo and return a JSON object with these fields:

- "title": short item name (3-8 words)
- "description": 2-3 sentences, neutral product-page tone, factual, no superlatives or guarantees
- "category": one of ${JSON.stringify(CATEGORIES)}
- "suggested_starting_price_eur": a reasonable starting auction price in EUR (number, e.g. 15.00). This is a rough guess, explicitly non-authoritative.
- "rarity_tier": one of "common", "rare", "jackpot"
- "rarity_reasoning": 2-3 bullet points explaining why this tier was assigned

Rules:
- Describe the item factually. Never claim authenticity or certified value.
- Never include URLs, promotions, contact info, or external references.
- Stay within a family-friendly, product-page tone.
- Default to "common" for rarity. Assign "rare" only with a specific visible reason (edition markings, apparent age, identifiable collector brand). Assign "jackpot" only when multiple strong visual indicators are present — when in doubt, go lower.
- If the photo is unclear, blurry, or shows multiple items, do your best with the most prominent item.

Return ONLY valid JSON, no markdown.`;

export async function analyzeItemPhoto(photoUrl: string): Promise<LotAnalysis> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: photoUrl, detail: "low" },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const raw = JSON.parse(response.choices[0].message.content ?? "{}");

  // Validate and normalize
  const category = CATEGORIES.includes(raw.category)
    ? (raw.category as Category)
    : "Curiosities & Oddities";

  const rarity = RARITY_TIERS.includes(raw.rarity_tier)
    ? (raw.rarity_tier as RarityTier)
    : "common";

  const priceEur = Number(raw.suggested_starting_price_eur);
  const suggestedPriceCents = priceEur > 0 ? Math.round(priceEur * 100) : 500;

  return {
    title: String(raw.title || "Untitled Item").slice(0, 200),
    description: String(raw.description || "No description available.").slice(0, 1000),
    category,
    suggestedPriceCents,
    rarity,
    rarityReasoning: String(raw.rarity_reasoning || "No reasoning provided.").slice(0, 500),
  };
}
