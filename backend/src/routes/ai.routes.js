import express from 'express';
import { summarizeProduct } from '../services/ai.service.js';
import { findProductByBarcode } from '../services/product.service.js';

const router = express.Router();

/**
 * POST /api/ai/summarize
 * Body: { barcode: string }
 * Looks up the product from the local dataset, then asks Gemini to summarise it.
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

        const product = findProductByBarcode(barcode);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: "Product not found for that barcode",
            });
        }

        const summary = await summarizeProduct(product);

        return res.status(200).json({
            success: true,
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