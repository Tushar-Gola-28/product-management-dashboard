import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader } from "../../components/ui";
import { Skeleton } from "../../components/ui/skeleton";
import { Star } from "lucide-react";
import { deleteProduct, getSingleProduct } from "../../services/product.service";
function StockBadge({ stock }: { stock: number }) {
    if (stock === 0) {
        return <Badge variant="destructive">Out of Stock</Badge>;
    }

    if (stock < 10) {
        return <Badge variant="secondary">Low Stock</Badge>;
    }

    return <Badge variant="outline">In Stock</Badge>;
}

function RatingStars({ rating = 0 }: { rating?: number }) {
    const fullStars = Math.floor(rating);

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        size={16}
                        className={
                            i < fullStars
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground"
                        }
                    />
                ))}
            </div>

            <span className="text-sm font-medium text-muted-foreground">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

export function ProductDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: product, isLoading } = useQuery({
        queryKey: ["product-details", id],
        queryFn: () => getSingleProduct(id as string),
        enabled: !!id,
    });

    const deleteMutation = useMutation({
        mutationFn: () => deleteProduct(id as string),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ["products"] });
            const prev = queryClient.getQueryData(["products"]);
            queryClient.setQueryData(["products"], (old: any) => {
                return {
                    ...old,
                    products: old.products.filter((p: any) => p._id !== id),
                };
            });

            return { prev };
        },
        onSuccess: () => {
            navigate("/products");
        },
        onError: (_err, _id, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(["products"], ctx.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const galleryImages = useMemo(() => {
        if (!product) return [];
        const all = [product.thumbnail, ...(product.images || [])];
        return all.filter((img) => img);
    }, [product]);


    const [activeImage, setActiveImage] = useState<string>("");

    useMemo(() => {
        if (galleryImages.length > 0 && !activeImage) {
            setActiveImage(galleryImages[0] as string);
        }
    }, [galleryImages]);

    if (isLoading) {
        return (
            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </CardHeader>

                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-[350px] w-full rounded-xl" />

                    <div className="space-y-4">
                        <Skeleton className="h-6 w-[70%]" />
                        <Skeleton className="h-5 w-[50%]" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!product) {
        return (
            <div className="p-6 text-muted-foreground text-center">
                Product not found.
            </div>
        );
    }

    const handleDelete = () => {
        const ok = window.confirm(`Delete "${product.title}"?`);
        if (!ok) return;
        deleteMutation.mutate();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">{product.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        View full product details and manage product actions.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button aria-label="Product edit" asChild variant="outline">
                        <Link to={`/products/${product.id}/edit`}>Edit</Link>
                    </Button>

                    <Button
                        variant="destructive"
                        aria-label="Delete"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </div>

            {/* Main Card */}
            <Card className="rounded-2xl shadow-sm">
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        <div className="w-full h-90 border rounded-2xl overflow-hidden bg-muted flex items-center justify-center">
                            <img
                                src={activeImage || product.thumbnail}
                                alt={product.title}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Thumbnails */}
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {galleryImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveImage(img as string)}
                                    className={`h-16 w-16 rounded-xl border overflow-hidden shrink-0 ${activeImage === img ? "ring-2 ring-primary" : ""
                                        }`}
                                >
                                    <img
                                        src={img as string}
                                        alt="thumb"
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-5">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <Badge variant="secondary">{product.category}</Badge>
                            <StockBadge stock={product.stock} />
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Brand</p>
                            <p className="font-semibold">{product.brand}</p>
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-sm leading-relaxed">{product.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border p-4">
                                <p className="text-xs text-muted-foreground">Price</p>
                                <p className="text-lg font-bold">₹{product.price}</p>
                            </div>

                            <div className="rounded-xl border p-4">
                                <p className="text-xs text-muted-foreground">Discount</p>
                                <p className="text-lg font-bold">
                                    {product.discountPercentage ?? 0}%
                                </p>
                            </div>

                            <div className="rounded-xl border p-4">
                                <p className="text-xs text-muted-foreground">Stock</p>
                                <p className="text-lg font-bold">{product.stock}</p>
                            </div>

                            <div className="rounded-xl border p-4">
                                <p className="text-xs text-muted-foreground">Rating</p>
                                <RatingStars rating={product.rating ?? 0} />
                            </div>
                        </div>

                        {/* Meta Info */}
                        <div className="rounded-xl border p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Product ID</span>
                                <span className="font-medium">{product.id}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Category Slug</span>
                                <span className="font-medium">{product.category}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
