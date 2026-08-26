import express from "express";
import { findProductWithFallback } from "../services/product.service.js";

const router = express.Router();

/**
 * GET /api/products/:barcode
 * Tries local dataset first, then Open Food Facts API.
 */
router.get("/:barcode", async (req, res) => {
    const { barcode } = req.params;

    const { product, source } = await findProductWithFallback(barcode);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found in our database or Open Food Facts.",
        });
    }

    return res.status(200).json({
        success: true,
        source,   // 'local' | 'open-food-facts'
        product,
    });
});

export default router;