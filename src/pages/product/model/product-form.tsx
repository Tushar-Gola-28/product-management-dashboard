import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
    Button,
    Card,
    Input,
    CardContent,
    CardHeader,
    CardTitle,
} from "../../../components/ui";
import { Textarea } from "../../../components/ui/textarea";
import { Label } from "../../../components/ui/label";
import { Badge } from "../../../components/ui/badge";
import { api } from "../../../lib/api-client";
import { showErrorToast, showSuccessToast } from "../../../lib/toast";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";

type Category = {
    slug: string;
    name: string;
    url: string;
};

type CloudinaryImage = {
    url: string;
    public_id: string;
};

const productSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.coerce.number().positive("Price must be positive"),
    discountPercentage: z.coerce
        .number()
        .min(0, "Discount must be 0-100")
        .max(100, "Discount must be 0-100")
        .optional()
        .or(z.literal("").transform(() => undefined)),
    stock: z.coerce
        .number()
        .int("Stock must be integer")
        .min(0, "Stock cannot be negative"),
    brand: z.string().min(1, "Brand is required"),
    categorySlug: z.string().min(1, "Category is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm({
    defaultValues,
    productId,
    existingThumbnail,
    existingImages,
}: {
    defaultValues?: Partial<ProductFormValues>;
    productId?: string;
    existingThumbnail?: CloudinaryImage;
    existingImages?: CloudinaryImage[];
}) {
    const navigate = useNavigate();

    const [thumbnail, setThumbnail] = useState<CloudinaryImage | null>(null);
    const [images, setImages] = useState<CloudinaryImage[]>([]);
    const [uploading, setUploading] = useState(false);
    const [thumbPreview, setThumbPreview] = useState<string | null>(null);
    const [galleryPreview, setGalleryPreview] = useState<string[]>([]);
    const [thumbProgress, setThumbProgress] = useState(0);
    const [galleryProgress, setGalleryProgress] = useState(0);

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            discountPercentage: undefined,
            stock: 0,
            brand: "",
            categorySlug: "",
            ...defaultValues,
        },
    });

    useEffect(() => {
        if (existingThumbnail) {
            setThumbnail(existingThumbnail);
        }
        if (existingImages?.length) {
            setImages(existingImages);
        }
    }, [existingThumbnail, existingImages]);

    const { register, formState } = form;
    const { errors } = formState;

    const { data: categories = [], isLoading: categoryLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await api.get("/products/categories");
            return res.data as Category[];
        },
    });

    const MAX_SIZE = 5 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const validateFile = (file: File) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            showErrorToast("Invalid File", "Only JPG, PNG, WEBP allowed");
            return false;
        }

        if (file.size > MAX_SIZE) {
            showErrorToast("File Too Large", "Max allowed size is 5MB");
            return false;
        }

        return true;
    };

    const uploadImage = async (
        file: File,
        onProgress?: (percent: number) => void
    ): Promise<CloudinaryImage> => {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("upload_preset", uploadPreset);
            formData.append("folder", "products");

            const xhr = new XMLHttpRequest();

            xhr.open(
                "POST",
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
            );

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;
                const percent = Math.round((event.loaded / event.total) * 100);
                onProgress?.(percent);
            };

            xhr.onload = () => {
                const data = JSON.parse(xhr.responseText);

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve({
                        url: data.secure_url,
                        public_id: data.public_id,
                    });
                } else {
                    reject(data?.error?.message || "Upload failed");
                }
            };

            xhr.onerror = () => reject("Upload failed. Network error.");

            xhr.send(formData);
        });
    };

    const handleThumbnailUpload = async (file: File) => {
        if (!validateFile(file)) return;

        setThumbPreview(URL.createObjectURL(file));
        setUploading(true);
        setThumbProgress(0);

        try {
            const uploaded = await uploadImage(file, setThumbProgress);
            setThumbnail(uploaded);
            showSuccessToast("Thumbnail Uploaded ✅");
        } catch (err: any) {
            showErrorToast("Thumbnail Upload Failed", err);
            setThumbPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleImagesUpload = async (files: FileList) => {
        const validFiles = Array.from(files).filter(validateFile);
        if (validFiles.length === 0) return;

        const previews = validFiles.map((f) => URL.createObjectURL(f));
        setGalleryPreview((prev) => [...prev, ...previews]);

        setUploading(true);
        setGalleryProgress(0);

        try {
            const uploadedList: CloudinaryImage[] = [];

            for (let i = 0; i < validFiles.length; i++) {
                const uploaded = await uploadImage(validFiles[i], setGalleryProgress);
                uploadedList.push(uploaded);
            }

            setImages((prev) => [...prev, ...uploadedList]);
            showSuccessToast("Gallery Images Uploaded ✅");
        } catch (err: any) {
            showErrorToast("Gallery Upload Failed", err);
        } finally {
            setUploading(false);
            setGalleryProgress(0);
        }
    };

    const mutation = useMutation({
        mutationFn: async (payload: any) => {
            if (productId) {
                return api.put(`/products/${productId}`, payload);
            }
            return api.post("/products/add", payload);
        },
        onSuccess: () => {
            if (productId) {
                showSuccessToast("Product Edit Successful ✅");
            } else {
                showSuccessToast("Product Created Successful ✅");
            }
            navigate(-1);
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message || err?.message || "Something went wrong";
            showErrorToast("Product Save Failed", message);
        },
    });

    const onSubmit: SubmitHandler<ProductFormValues> = async (values) => {
        if (!thumbnail) {
            showErrorToast("Thumbnail Required", "Please upload thumbnail image");
            return;
        }

        const selectedCategory = categories.find(
            (c) => c.slug === values.categorySlug
        );

        if (!selectedCategory) {
            showErrorToast("Invalid Category", "Please select valid category");
            return;
        }

        const payload = {
            title: values.title,
            description: values.description,
            price: values.price,
            discountPercentage: values.discountPercentage ?? 0,
            stock: values.stock,
            brand: values.brand,
            category: selectedCategory,
            thumbnail,
            images,
        };

        mutation.mutate(payload);
    };

    return (
        <Card className="rounded-2xl shadow-sm">
            <CardHeader>
                <CardTitle className="text-xl font-bold">
                    {productId ? "Update Product" : "Create Product"}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input placeholder="Enter product title" {...register("title")} />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        {/* Brand */}
                        <div className="space-y-2">
                            <Label>Brand *</Label>
                            <Input placeholder="Enter brand name" {...register("brand")} />
                            {errors.brand && (
                                <p className="text-sm text-red-500">{errors.brand.message}</p>
                            )}
                        </div>

                        {/* Price */}
                        <div className="space-y-2">
                            <Label>Price (₹) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...register("price")}
                            />
                            {errors.price && (
                                <p className="text-sm text-red-500">{errors.price.message}</p>
                            )}
                        </div>

                        {/* Discount */}
                        <div className="space-y-2">
                            <Label>Discount Percentage</Label>
                            <Input
                                type="number"
                                placeholder="0 - 100"
                                {...register("discountPercentage")}
                            />
                            {errors.discountPercentage && (
                                <p className="text-sm text-red-500">
                                    {errors.discountPercentage.message}
                                </p>
                            )}
                        </div>

                        {/* Stock */}
                        <div className="space-y-2">
                            <Label>Stock *</Label>
                            <Input type="number" placeholder="0" {...register("stock")} />
                            {errors.stock && (
                                <p className="text-sm text-red-500">{errors.stock.message}</p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <select
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                {...register("categorySlug")}
                            >
                                <option value="">Select Category</option>

                                {categoryLoading ? (
                                    <option disabled>Loading...</option>
                                ) : (
                                    categories.map((c) => (
                                        <option key={c.slug} value={c.slug}>
                                            {c.name}
                                        </option>
                                    ))
                                )}
                            </select>

                            {errors.categorySlug && (
                                <p className="text-sm text-red-500">
                                    {errors.categorySlug.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                            placeholder="Enter description..."
                            className="min-h-[120px]"
                            {...register("description")}
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">
                                {errors.description.message}
                            </p>
                        )}
                    </div>

                    {/* Uploads */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Thumbnail */}
                        <div className="space-y-2">
                            <Label>Thumbnail *</Label>

                            <Input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        handleThumbnailUpload(e.target.files[0]);
                                    }
                                }}
                            />

                            {thumbPreview && !thumbnail && (
                                <div className="mt-2 flex items-center gap-3 rounded-xl border p-3">
                                    <img
                                        src={thumbPreview}
                                        className="h-14 w-14 rounded-lg object-cover border"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Preview</p>
                                        <p className="text-xs text-muted-foreground">
                                            Uploading... {thumbProgress}%
                                        </p>
                                    </div>
                                </div>
                            )}

                            {thumbnail ? (
                                <div className="mt-2 flex items-center gap-3 rounded-xl border p-3">
                                    <img
                                        src={thumbnail.url}
                                        className="h-14 w-14 rounded-lg object-cover border"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">Thumbnail Uploaded</p>
                                        <p className="text-xs text-muted-foreground">
                                            {thumbnail.public_id}
                                        </p>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            setThumbnail(null);
                                            setThumbPreview(null);
                                            setThumbProgress(0);
                                        }}
                                        aria-label="Remove"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Only JPG / PNG / WEBP (max 5MB)
                                </p>
                            )}
                        </div>

                        {/* Images */}
                        <div className="space-y-2">
                            <Label>Images (Optional)</Label>

                            <Input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                multiple
                                onChange={(e) => {
                                    if (e.target.files) {
                                        handleImagesUpload(e.target.files);
                                    }
                                }}
                            />

                            {galleryPreview.length > 0 && images.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Uploading... {galleryProgress}%
                                </p>
                            )}

                            {images.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {images.map((img, ind) => (
                                        <div key={img.public_id || ind} className="relative">
                                            <img
                                                src={img.url}
                                                className="h-16 w-16 rounded-lg object-cover border"
                                            />

                                            <button
                                                type="button"
                                                aria-label="X"
                                                onClick={() =>
                                                    setImages((prev) =>
                                                        prev.filter((_, index) => index !== ind)
                                                    )
                                                }
                                                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5"
                                            >
                                                X
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Upload multiple images (jpg/png/webp max 5MB each)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex items-center justify-between gap-3 flex-wrap border-t pt-5">
                        <div className="flex gap-2">
                            <Badge variant="secondary">Cloudinary Upload</Badge>
                            {uploading && <Badge variant="outline">Uploading...</Badge>}
                        </div>

                        <Button type="submit" aria-label="Submit Button" disabled={mutation.isPending || uploading}>
                            {(mutation.isPending || uploading) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}

                            {mutation.isPending || uploading
                                ? "Saving..."
                                : productId
                                    ? "Update Product"
                                    : "Create Product"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
