import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function summarizeProduct(product) {
    // instead of text can change it to product

    if (!product) {
        throw new Error("Product data is required");
    }
    const {
        title,
        description,
        category,
        price,
        listing_type,
    } = product;

    if (!title || !description) {
        throw new Error("Product title and description are required");
    }
    const prompt = `
You are an AI product summarization assistant.

Your task is to create a short, clear and useful summary
of the following product listing.

Product details:

Title: ${title}
Description: ${description}
Category: ${category || "Not specified"}
Price: ${price ?? "Not specified"}
Listing Type: ${listing_type || "Not specified"}

Requirements:
- Keep the summary concise.
- Clearly mention what the product is.
- Mention its condition if provided.
- Mention the price if provided.
- Mention whether it is for rent or sale if provided.
- Do not invent information.
- Only use information provided in the product details.
`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return response.text;
}