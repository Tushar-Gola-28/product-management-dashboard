export type Category = {
    slug: string;
    name: string;
    url: string;
};

export type CloudinaryImage = {
    url: string;
    public_id: string;
};

export type Product = {
    _id: string;

    title: string;
    description: string;

    price: number;
    discountPercentage?: number;

    stock: number;
    brand: string;

    category: Category;

    thumbnail: CloudinaryImage;

    images?: CloudinaryImage[];

    rating?: number;

    createdAt?: string;
    updatedAt?: string;
};
