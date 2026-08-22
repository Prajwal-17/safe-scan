import { products } from "../data/products.js";

export function findProductByBarcode(barcode) {
    return products.find(
        (products) => products.barcode == barcode
    );
}