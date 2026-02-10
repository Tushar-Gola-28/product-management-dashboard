import type { Category, CloudinaryImage } from "./product";

export type ProductFormValues = {
    title: string;
    description: string;
    price: number;
    discountPercentage?: number;
    stock: number;
    brand: string;
    category: Category | null;
    thumbnail: CloudinaryImage | null;
    images?: CloudinaryImage[];
};
