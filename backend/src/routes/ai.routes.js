import express from 'express';
import { summarizeProduct } from '../services/ai.service.js';
const router = express.Router();
router.post("/summarize", async (req, res) => {
    try {
        const product = req.body;
        if (!product.title || !product.description) {
            return res.status(400).json({
                success: false,
                error: "Product title and description are required",
            });
        }
        const summary = await summarizeProduct(product);
        return res.status(200).json({
            success: true,
            summary,
        });
    }
    catch (error) {
        console.error("Ai summerization error :", error);

        return res.status(500).json({
            success: false,
            error: "Failed to summarize product",
        });
    }
});
export default router;