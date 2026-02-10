import { useMemo } from 'react'
import { api } from '../../../lib/api-client';
import { useQuery } from '@tanstack/react-query';

const getProducts = async () => {
    const res = await api.get("/products");
    return res.data;
};

const getUsers = async () => {
    const res = await api.get("/users");
    return res.data;
};

const getCategories = async () => {
    const res = await api.get("/products/categories");
    return res.data;
};

export function useFunction() {
    const { data: productsResponse, isLoading: productsLoading } = useQuery({
        queryKey: ["products"],
        queryFn: getProducts,
    });

    const { data: usersResponse, isLoading: usersLoading } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
    });

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
    const products = productsResponse?.products || [];
    const totalProducts = productsResponse?.total || products.length;
    const totalUsers = usersResponse?.total || 0;

    const isLoading = productsLoading || usersLoading || categoriesLoading;


    const stats = useMemo(() => {
        const lowStockCount = products.filter((p: any) => p.stock < 10).length;

        const avgPrice =
            products.length > 0
                ? products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) /
                products.length
                : 0;

        const avgRating =
            products.length > 0
                ? products.reduce((sum: number, p: any) => sum + (p.rating || 0), 0) /
                products.length
                : 0;

        const categoriesCount = categories?.length || 0;

        return {
            lowStockCount,
            avgPrice,
            avgRating,
            categoriesCount,
        };
    }, [products, categories]);

    const productsByCategory = useMemo(() => {
        const map: Record<string, number> = {};

        products.forEach((p: any) => {
            const cat = p.category || "Unknown";
            map[cat] = (map[cat] || 0) + 1;
        });

        return Object.entries(map).map(([name, value]) => ({
            name,
            value,
        }));
    }, [products]);

    const priceRangeData = useMemo(() => {
        const ranges = {
            "₹0-500": 0,
            "₹500-1000": 0,
            "₹1000-2000": 0,
            "₹2000+": 0,
        };

        products.forEach((p: any) => {
            const price = p.price || 0;

            if (price < 500) ranges["₹0-500"]++;
            else if (price < 1000) ranges["₹500-1000"]++;
            else if (price < 2000) ranges["₹1000-2000"]++;
            else ranges["₹2000+"]++;
        });

        return Object.entries(ranges).map(([range, count]) => ({
            range,
            count,
        }));
    }, [products]);

    const topRatedProducts = useMemo(() => {
        return [...products]
            .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 10)
            .map((p: any) => ({
                title: p.title,
                rating: p.rating,
            }));
    }, [products]);

    const recentProducts = useMemo(() => {
        return [...products]
            .sort(
                (a: any, b: any) =>
                    new Date(b.createdAt || b.updatedAt || 0).getTime() -
                    new Date(a.createdAt || a.updatedAt || 0).getTime()
            )
            .slice(0, 5);
    }, [products]);

    return { recentProducts, topRatedProducts, priceRangeData, productsByCategory, stats, isLoading, totalProducts, totalUsers }
}
