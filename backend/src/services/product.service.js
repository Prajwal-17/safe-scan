import { products } from "../data/products.js";

// ─── Local dataset lookup ────────────────────────────────────────────────────

export function findProductByBarcode(barcode) {
    return products.find(p => p.barcode === barcode.trim());
}

// ─── Open Food Facts integration ─────────────────────────────────────────────

const OFF_API = "https://world.openfoodfacts.org/api/v2/product";

/**
 * Fetch a product from Open Food Facts and map it to our schema.
 * Returns null if not found or request fails.
 */
export async function fetchFromOpenFoodFacts(barcode) {
    try {
        const res = await fetch(`${OFF_API}/${barcode}.json`, {
            headers: { "User-Agent": "SafeScan/1.0 (hackathon project)" },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return null;
        const json = await res.json();
        if (json.status !== 1 || !json.product) return null;

        return mapOFFProduct(barcode, json.product);
    } catch {
        return null;
    }
}

/**
 * Try local dataset first, then fall back to Open Food Facts.
 * Returns { product, source: 'local' | 'open-food-facts' | null }
 */
export async function findProductWithFallback(barcode) {
    const local = findProductByBarcode(barcode);
    if (local) return { product: local, source: "local" };

    const external = await fetchFromOpenFoodFacts(barcode);
    if (external) return { product: external, source: "open-food-facts" };

    return { product: null, source: null };
}

// ─── Open Food Facts → SafeScan schema mapper ────────────────────────────────

function mapOFFProduct(barcode, p) {
    const name = p.product_name || p.product_name_en || p.abbreviated_product_name || "Unknown Product";
    const brand = p.brands || "Unknown Brand";
    const categoryRaw = (p.categories || "Food Product").split(",")[0].trim();
    const category = categoryRaw.replace(/^en:/, "").replace(/-/g, " ");

    // ── Safety score from Nutri-Score + Nova Group ──
    const nutriscore = (p.nutriscore_grade || "").toLowerCase();
    const novaGroup = parseInt(p.nova_group) || 0;

    const nutriscoreMap = { a: 90, b: 75, c: 58, d: 40, e: 22 };
    let safetyScore = nutriscoreMap[nutriscore] ?? 60;

    // Nova group adjustments (1 = minimally processed, 4 = ultra-processed)
    if (novaGroup === 1) safetyScore = Math.min(100, safetyScore + 8);
    else if (novaGroup === 3) safetyScore = Math.max(0, safetyScore - 5);
    else if (novaGroup === 4) safetyScore = Math.max(0, safetyScore - 15);

    // ── Allergens ──
    const allergens = (p.allergens_tags || [])
        .map(a => a.replace(/^en:/, "").replace(/-/g, " "))
        .map(a => a.charAt(0).toUpperCase() + a.slice(1))
        .filter(Boolean);

    // ── Ingredients ──
    const ingredientsText = p.ingredients_text_en || p.ingredients_text || "";
    const ingredients = ingredientsText
        ? ingredientsText
            .replace(/_/g, "")            // OFF sometimes wraps allergens in underscores
            .split(/,(?![^(]*\))/)        // split on commas not inside parentheses
            .map(i => i.trim())
            .filter(i => i.length > 1)
            .slice(0, 15)
        : ["Not specified"];

    // ── Nutrition ──
    const n = p.nutriments || {};
    const nutritionHighlights = [];

    const addNutrition = (label, key, unit, multiplier = 1, round = 1) => {
        const val = n[key];
        if (val != null) {
            const display = round === 0 ? Math.round(val * multiplier) : Math.round(val * multiplier * 10) / 10;
            nutritionHighlights.push({ label, value: `${display} ${unit}` });
        }
    };

    addNutrition("Fat", "fat_100g", "g");
    addNutrition("Saturated Fat", "saturated-fat_100g", "g");
    addNutrition("Carbohydrates", "carbohydrates_100g", "g");
    addNutrition("Sugars", "sugars_100g", "g");
    addNutrition("Protein", "proteins_100g", "g");
    addNutrition("Sodium", "sodium_100g", "mg", 1000, 0);
    addNutrition("Fiber", "fiber_100g", "g");

    // ── Warnings (generated from data) ──
    const warnings = [];
    if (novaGroup === 4) warnings.push("Ultra-processed food (Nova Group 4)");
    if (n["saturated-fat_100g"] > 5) warnings.push(`High saturated fat — ${n["saturated-fat_100g"]}g per 100g`);
    if (n["sugars_100g"] > 22.5) warnings.push(`High sugar content — ${n["sugars_100g"]}g per 100g`);
    if (n["sodium_100g"] > 0.6) warnings.push(`High sodium — ${Math.round(n["sodium_100g"] * 1000)}mg per 100g`);
    if (nutriscore === "e") warnings.push("Poor Nutri-Score (E) — consider a healthier alternative");

    // ── Certifications / labels ──
    const certifications = [];
    const labels = (p.labels || "").toLowerCase();
    if (labels.includes("organic")) certifications.push("Organic");
    if (labels.includes("vegan")) certifications.push("Vegan");
    if (labels.includes("vegetarian")) certifications.push("Vegetarian");
    if (labels.includes("gluten-free") || labels.includes("gluten free")) certifications.push("Gluten Free");
    if (labels.includes("fair trade") || labels.includes("fairtrade")) certifications.push("Fair Trade");
    if (nutriscore && nutriscoreMap[nutriscore] != null) certifications.push(`Nutri-Score ${nutriscore.toUpperCase()}`);
    if (novaGroup) certifications.push(`Nova Group ${novaGroup}`);

    const calories = Math.round(
        n["energy-kcal_serving"] || n["energy-kcal_100g"] || (n["energy_100g"] ?? 0) / 4.184 || 0
    );

    return {
        barcode,
        name,
        brand,
        category,
        imageEmoji: categoryEmoji(category),
        ingredients,
        allergens: allergens.length ? allergens : ["None declared"],
        safetyScore,
        warnings,
        certifications,
        servingSize: p.serving_size || "100 g",
        calories,
        nutritionHighlights,
        source: "open-food-facts",
    };
}

function categoryEmoji(cat) {
    const c = cat.toLowerCase();
    if (/chocolate|confection|candy|sweet/.test(c)) return "🍫";
    if (/beverage|drink|soda|cola|juice|water/.test(c)) return "🥤";
    if (/milk|dairy|cheese|yogurt|butter/.test(c)) return "🧀";
    if (/bread|bakery|biscuit|cookie|cake/.test(c)) return "🍞";
    if (/cereal|oat|muesli|granola/.test(c)) return "🥣";
    if (/meat|chicken|beef|pork|fish|seafood/.test(c)) return "🥩";
    if (/fruit|berry|jam|marmalade/.test(c)) return "🍎";
    if (/vegetable|salad|legume|bean/.test(c)) return "🥗";
    if (/snack|chip|crisp|popcorn/.test(c)) return "🥨";
    if (/sauce|condiment|ketchup|mayo|mustard/.test(c)) return "🫙";
    if (/oil|fat|margarine/.test(c)) return "🫒";
    if (/tea|coffee|cocoa/.test(c)) return "☕";
    if (/ice cream|dessert|pudding/.test(c)) return "🍦";
    if (/pasta|noodle|spaghetti/.test(c)) return "🍝";
    if (/rice|grain|flour/.test(c)) return "🌾";
    if (/spice|herb|seasoning/.test(c)) return "🌿";
    if (/nut|seed|peanut|almond/.test(c)) return "🥜";
    return "🛒";
}