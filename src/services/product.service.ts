import { api } from "../lib/api-client";

export type Product = {
    id?: number;
    _id?: string;
    title: string;
    brand?: string;
    category?: string;
    price?: number;
    stock?: number;
    rating?: number;
    thumbnail?: string;
    image?: string;
};

export type ProductsResponse = {
    products: Product[];
    total: number;
    limit?: number;
    skip?: number;
};

export async function getCategories() {
    const res = await api.get<string[]>("/products/categories");
    return res.data ?? [];
}

export async function getProductsPaged(params: { limit: number; skip: number }) {
    const res = await api.get<ProductsResponse>(`/products?limit=${params.limit}&skip=${params.skip}`);
    return res.data;
}

export async function searchProducts(params: { q: string; limit: number; skip: number }) {
    const res = await api.get<ProductsResponse>(
        `/products/search?q=${encodeURIComponent(params.q)}&limit=${params.limit}&skip=${params.skip}`
    );
    return res.data;
}

export async function getProductsByCategory(params: { categoryName: string; limit: number; skip: number }) {
    const res = await api.get<ProductsResponse>(
        `/products/category/${encodeURIComponent(params.categoryName)}?limit=${params.limit}&skip=${params.skip}`
    );
    return res.data;
}

export async function deleteProduct(id: string | number) {
    const res = await api.delete(`/products/${id}`);
    return res.data;
}

export async function bulkDeleteProducts(ids: Array<string | number>) {
    const res = await api.post(`/products/bulk-delete`, { ids });
    return res.data;
}

export const getSingleProduct = async (id: string | number) => {
    const res = await api.get(`/products/${id}`);
    return res.data;
};


