import express from 'express';
import { summarizeProduct } from '../services/ai.service.js';
import { findProductWithFallback } from '../services/product.service.js';

const router = express.Router();

/**
 * POST /api/ai/summarize
 * Body: { barcode: string }
 * Looks up the product (local first, then Open Food Facts), then asks Gemini to summarise.
 */
router.post("/summarize", async (req, res) => {
    try {
        const { barcode } = req.body;

        if (!barcode) {
            return res.status(400).json({
                success: false,
                error: "barcode is required",
            });
        }

        const { product, source } = await findProductWithFallback(barcode);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found — try entering the barcode manually or check the number.",
            });
        }

        const summary = await summarizeProduct(product);

        return res.status(200).json({
            success: true,
            source,
            summary,
            product,
        });
    } catch (error) {
        console.error("AI summarization error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to generate product summary",
        });
    }
});

export default router;