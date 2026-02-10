import type { Product } from "./product";

export type ProductsResponse = {
    products: Product[];
    total: number;
    limit: number;
    skip: number;
};

export type SingleProductResponse = {
    product: Product;
};
