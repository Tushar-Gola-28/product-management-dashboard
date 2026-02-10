import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getSingleProduct } from "../../services/product.service";
import { ProductForm } from "./model/product-form";
import { Skeleton } from "../../components/ui/skeleton";
import { Card, CardContent, CardHeader } from "../../components/ui";

export function EditProductPage() {
    const { id } = useParams();

    const { data, isLoading } = useQuery({
        queryKey: ["product", id],
        queryFn: () => getSingleProduct(id as string),
        enabled: !!id,
    });

    if (isLoading) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Grid skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>

                    {/* Description skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-28 w-full" />
                    </div>

                    {/* Upload skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                        </div>

                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                            <div className="flex gap-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-16 rounded-lg" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Button skeleton */}
                    <div className="flex items-center justify-between border-t pt-5">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-10 w-32 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const product = data;

    return (
        <ProductForm
            productId={id}
            defaultValues={{
                title: product.title,
                description: product.description,
                price: product.price,
                discountPercentage: product.discountPercentage,
                stock: product.stock,
                brand: product.brand,
                categorySlug: product.category?.slug,
            }}
            existingThumbnail={product.thumbnail}
            existingImages={product.images}
        />
    );
}
