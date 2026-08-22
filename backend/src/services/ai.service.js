import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate an AI safety summary for a product from our local dataset.
 * @param {object} product - Full product object from products.js
 */
export async function summarizeProduct(product) {
    if (!product || !product.name) {
        throw new Error("Product data with a name is required");
    }

    const {
        name,
        brand,
        category,
        servingSize,
        calories,
        ingredients,
        allergens,
        safetyScore,
        warnings,
        certifications,
        nutritionHighlights,
    } = product;

    const nutritionText = (nutritionHighlights ?? [])
        .map(n => `${n.label}: ${n.value}`)
        .join("\n") || "Not specified";

    const prompt = `
You are SafeScan, an AI ingredient safety assistant designed to help everyday consumers understand what is in their food and personal care products.

Analyse the following product and provide a clear, friendly, and honest safety summary.

--- PRODUCT DATA ---
Name: ${name}
Brand: ${brand ?? "Not specified"}
Category: ${category ?? "Not specified"}
Serving Size: ${servingSize ?? "Not specified"}
Calories per serving: ${calories ?? "Not specified"} kcal
Safety Score: ${safetyScore} / 100

Ingredients: ${(ingredients ?? []).join(", ") || "Not specified"}

Nutrition per serving:
${nutritionText}

Allergens: ${(allergens ?? []).join(", ") || "None declared"}
Warnings: ${(warnings ?? []).join("; ") || "None"}
Certifications: ${(certifications ?? []).join(", ") || "None"}
--- END PRODUCT DATA ---

Write a 3-paragraph consumer-friendly summary:
1. **Overview** — What this product is and its general purpose.
2. **Nutritional & Ingredient Highlights** — Key things to know about the ingredients and nutrition: what is high/low, anything notable. Be specific with numbers.
3. **SafeScan Verdict** — Based on the safety score of ${safetyScore}/100, give an honest overall verdict. Mention who should be cautious (e.g. diabetics, people with certain allergies) and whether it is generally safe to consume regularly.

Rules:
- Keep each paragraph to 2-4 sentences.
- Use plain English a non-expert can understand.
- Do NOT invent data not in the product details above.
- Do NOT diagnose medical conditions.
- Do NOT use markdown headers or bullet points — write in plain flowing paragraphs only.
`.trim();

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text;
}