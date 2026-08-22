import express from "express";
import { findProductByBarcode } from "../services/product.service.js";
const router = express.Router();

router.get("/:barcode", (req, res) => {
    const { barcode } = req.params;
    const product = findProductByBarcode(barcode);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found ",
        });
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
export default router;