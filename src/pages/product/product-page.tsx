
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toInt } from "../../lib/url";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../../components/ui/accordion";

import {
    bulkDeleteProducts,
    deleteProduct,
    getCategories,
    getProductsByCategory,
    getProductsPaged,
    searchProducts,
    type Product,
} from "../../services/product.service";
import { useDebouncedValue } from "../../hooks/use-debounced-value";
import { Skeleton } from "../../components/ui/skeleton";
import { cn, getPageSizeFromSettings, getTableDensityFromSettings } from "../../lib/utils";
type SortKey = "title" | "price" | "rating" | "stock";
type SortDir = "asc" | "desc";


function getId(p: Product) {
    return (p._id ?? p.id) as string | number;
}

export function ProductPage() {
    const LIMIT = getPageSizeFromSettings();
    const density = getTableDensityFromSettings();

    const rowClass =
        density === "compact"
            ? "h-10 text-sm"
            : "h-14 text-base";

    const cellClass =
        density === "compact"
            ? "py-2"
            : "py-4";
    const qc = useQueryClient();
    const [sp, setSp] = useSearchParams();
    const page = toInt(sp.get("page"), 1);
    const search = sp.get("search") ?? "";
    const category = sp.get("category") ?? "all";
    const sort = (sp.get("sort") ?? "title") as SortKey;
    const dir = (sp.get("dir") ?? "asc") as SortDir;

    const [searchInput, setSearchInput] = useState(search);
    useEffect(() => setSearchInput(search), [search]);

    const debouncedSearch = useDebouncedValue(searchInput, 300);

    useEffect(() => {
        if (debouncedSearch === search) return;
        const next = new URLSearchParams(sp);
        if (debouncedSearch) next.set("search", debouncedSearch);
        else next.delete("search");
        next.set("page", "1");
        setSp(next, { replace: true });
    }, [debouncedSearch]);

    const skip = (page - 1) * LIMIT;

    const { data: categories = [], isLoading: categoriesLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
    });
    const queryKey = useMemo(() => {
        return ["products", { page, limit: LIMIT, skip, search, category }];
    }, [page, skip, search, category]);

    const productsQuery = useQuery({
        queryKey,
        queryFn: async () => {
            if (search) return searchProducts({ q: search, limit: LIMIT, skip });
            if (category !== "all") return getProductsByCategory({ categoryName: category, limit: LIMIT, skip });
            return getProductsPaged({ limit: LIMIT, skip });
        },
        keepPreviousData: true,
    });

    const isLoading = productsQuery.isLoading || categoriesLoading;
    const response = productsQuery.data;
    const serverProducts = response?.products ?? [];
    const total = response?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / LIMIT));

    const products = useMemo(() => {
        const copy = [...serverProducts];
        const mul = dir === "asc" ? 1 : -1;

        copy.sort((a, b) => {
            if (sort === "title") {
                return (String(a.title ?? "").localeCompare(String(b.title ?? ""))) * mul;
            }
            const av = Number((a as any)[sort] ?? 0);
            const bv = Number((b as any)[sort] ?? 0);
            return (av - bv) * mul;
        });

        return copy;
    }, [serverProducts, sort, dir]);

    const [selected, setSelected] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setSelected({});
    }, [page, search, category]);

    const selectedIds = useMemo(() => {
        return Object.entries(selected)
            .filter(([, v]) => v)
            .map(([k]) => k);
    }, [selected]);

    const allVisibleSelected = products.length > 0 && products.every((p) => selected[String(getId(p))]);
    const someVisibleSelected = products.some((p) => selected[String(getId(p))]);

    const setPage = (p: number) => {
        const next = new URLSearchParams(sp);
        next.set("page", String(Math.min(Math.max(1, p), totalPages)));
        setSp(next);
    };

    const setCategory = (c: string) => {
        const next = new URLSearchParams(sp);
        if (!c || c === "all") next.delete("category");
        else next.set("category", c);
        next.set("page", "1");
        setSp(next);
    };

    const setSort = (key: SortKey) => {
        const next = new URLSearchParams(sp);
        next.set("sort", key);
        setSp(next);
    };

    const toggleDir = () => {
        const next = new URLSearchParams(sp);
        next.set("dir", dir === "asc" ? "desc" : "asc");
        setSp(next);
    };

    const clearFilters = () => {
        const next = new URLSearchParams();
        next.set("page", "1");
        setSp(next);
        setSearchInput("");
    };

    const deleteMutation = useMutation({
        mutationFn: (id: string | number) => deleteProduct(id),
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey });

            const prev = qc.getQueryData<any>(queryKey);
            qc.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    products: (old.products ?? []).filter((p: Product) => String(getId(p)) !== String(id)),
                    total: Math.max(0, (old.total ?? 0) - 1),
                };
            });

            return { prev };
        },
        onError: (_e, _id, ctx) => {
            if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: Array<string | number>) => {
            return bulkDeleteProducts(ids);
        },
        onMutate: async (ids) => {
            await qc.cancelQueries({ queryKey });
            const prev = qc.getQueryData<any>(queryKey);

            qc.setQueryData(queryKey, (old: any) => {
                if (!old) return old;
                const idSet = new Set(ids.map(String));
                return {
                    ...old,
                    products: (old.products ?? []).filter((p: Product) => !idSet.has(String(getId(p)))),
                    total: Math.max(0, (old.total ?? 0) - ids.length),
                };
            });

            setSelected({});
            return { prev };
        },
        onError: (_e, _ids, ctx) => {
            if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["products"] });
        },
    });

    const onDelete = (p: Product) => {
        const id = getId(p);
        const ok = window.confirm(`Delete "${p.title}"?`);
        if (!ok) return;
        deleteMutation.mutate(id);
    };

    const onBulkDelete = () => {
        if (selectedIds.length === 0) return;
        const ok = window.confirm(`Delete ${selectedIds.length} selected products?`);
        if (!ok) return;
        bulkDeleteMutation.mutate(selectedIds);
    };
    const exportToCSV = () => {
        if (!products || products.length === 0) return;

        const headers = [
            "ID",
            "Title",
            "Brand",
            "Category",
            "Price",
            "Discount",
            "Stock",
            "Rating",
        ];

        const rows = products.map((p) => [
            getId(p),
            `"${p.title || ""}"`,
            `"${p.brand || ""}"`,
            `"${(p as any).category?.name || p.category || ""}"`,
            p.price ?? 0,
            p.discountPercentage ?? 0,
            p.stock ?? 0,
            p.rating ?? 0,
        ]);

        const csvContent =
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", "products.csv");

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };


    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold">Products</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage products with search, filters, sorting, pagination and bulk actions.
                    </p>
                </div>

                <Button asChild aria-label="Add product">
                    <Link to="/products/new">Add Product</Link>
                </Button>
            </div>

            <Card className="rounded-2xl">
                <CardContent className="p-0">
                    <Accordion type="single" collapsible defaultValue="filters">
                        <AccordionItem value="filters" className="border-none">
                            <AccordionTrigger className="px-6 py-4 hover:no-underline">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex flex-col text-left">
                                        <span className="text-base font-semibold">Filters</span>
                                        <span className="text-xs text-muted-foreground">
                                            Search, category and sorting options
                                        </span>
                                    </div>

                                    <Badge variant="secondary" className="ml-3">
                                        {total} Products
                                    </Badge>
                                </div>
                            </AccordionTrigger>

                            <AccordionContent className="px-6 pb-5">
                                <div className="flex flex-col gap-3">
                                    {/* Filters Row */}
                                    <div className="flex flex-col md:flex-row gap-3">
                                        <Input
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            placeholder="Search products (debounced 300ms)…"
                                        />

                                        <select
                                            className="h-10 rounded-md border bg-background px-3 text-sm"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="all">All Categories</option>
                                            {categories.map((c: { slug: string; name: string; url: string }) => (
                                                <option key={c.slug} value={c.slug}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>

                                        <select
                                            className="h-10 rounded-md border bg-background px-3 text-sm"
                                            value={sort}
                                            onChange={(e) => setSort(e.target.value as SortKey)}
                                        >
                                            <option value="title">Sort: Title</option>
                                            <option value="price">Sort: Price</option>
                                            <option value="rating">Sort: Rating</option>
                                            <option value="stock">Sort: Stock</option>
                                        </select>

                                        <Button variant="outline" onClick={toggleDir}>
                                            {dir === "asc" ? "Asc" : "Desc"}
                                        </Button>

                                        <Button variant="ghost" aria-label="Reset" onClick={clearFilters}>
                                            Reset
                                        </Button>
                                    </div>

                                    {/* Active Filter Badges */}
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="text-sm text-muted-foreground flex flex-wrap gap-2">
                                            <span>
                                                Total:{" "}
                                                <span className="font-medium text-foreground">{total}</span>
                                            </span>

                                            {search ? (
                                                <Badge variant="secondary">search: {search}</Badge>
                                            ) : null}

                                            {category !== "all" ? (
                                                <Badge variant="secondary">category: {category}</Badge>
                                            ) : null}

                                            <Badge variant="outline">
                                                sort: {sort} ({dir})
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" onClick={exportToCSV}>
                                                Export CSV
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                aria-label="Bulk Delete"
                                                onClick={onBulkDelete}
                                                disabled={selectedIds.length === 0 || bulkDeleteMutation.isPending}
                                            >
                                                Bulk Delete {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}
                                            </Button>

                                            <Button
                                                variant="outline" aria-label="Refresh"
                                                onClick={() => productsQuery.refetch()}
                                                disabled={productsQuery.isFetching}
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>


            {/* Table */}
            <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Product List</CardTitle>
                </CardHeader>

                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {/* Filters Skeleton */}
                            <div className="flex flex-col md:flex-row gap-3">
                                <Skeleton className="h-10 w-full md:w-[40%]" />
                                <Skeleton className="h-10 w-full md:w-[20%]" />
                                <Skeleton className="h-10 w-full md:w-[20%]" />
                                <Skeleton className="h-10 w-full md:w-[10%]" />
                                <Skeleton className="h-10 w-full md:w-[10%]" />
                            </div>

                            {/* Badges + Buttons Skeleton */}
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <Skeleton className="h-5 w-[200px]" />

                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-[120px]" />
                                    <Skeleton className="h-10 w-[90px]" />
                                </div>
                            </div>

                            {/* Table Skeleton */}
                            <div className="border rounded-xl overflow-hidden">
                                <div className="grid grid-cols-9 gap-3 p-3 border-b bg-muted/30">
                                    {Array.from({ length: 9 }).map((_, idx) => (
                                        <Skeleton key={idx} className="h-5 w-full" />
                                    ))}
                                </div>

                                {Array.from({ length: 8 }).map((_, idx) => (
                                    <div key={idx} className="grid grid-cols-9 gap-3 p-3 border-b">
                                        <Skeleton className="h-5 w-5" />
                                        <Skeleton className="h-10 w-10 rounded-lg" />
                                        <Skeleton className="h-5 w-30" />
                                        <Skeleton className="h-5 w-[80px]" />
                                        <Skeleton className="h-5 w-[90px]" />
                                        <Skeleton className="h-5 w-[60px]" />
                                        <Skeleton className="h-5 w-[50px]" />
                                        <Skeleton className="h-5 w-[40px]" />
                                        <Skeleton className="h-8 w-[140px]" />
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Skeleton */}
                            <div className="flex items-center justify-between mt-4">
                                <Skeleton className="h-5 w-[150px]" />

                                <div className="flex gap-2">
                                    <Skeleton className="h-10 w-[80px]" />
                                    <Skeleton className="h-10 w-[80px]" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className={rowClass}>
                                    <TableHead className="w-10">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            ref={(el) => {
                                                if (!el) return;
                                                el.indeterminate = !allVisibleSelected && someVisibleSelected;
                                            }}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                const next: Record<string, boolean> = { ...selected };
                                                products.forEach((p) => {
                                                    next[String(getId(p))] = checked;
                                                });
                                                setSelected(next);
                                            }}
                                        />
                                    </TableHead>

                                    <TableHead>Thumbnail</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Brand</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">Price</TableHead>
                                    <TableHead className="text-right">Stock</TableHead>
                                    <TableHead className="text-right">Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {products.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                                            No products found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.map((p) => {
                                        const id = getId(p);
                                        return (
                                            <TableRow key={String(id)} className={rowClass}>
                                                <TableCell className={cellClass}>
                                                    <input
                                                        type="checkbox"
                                                        checked={!!selected[String(id)]}
                                                        onChange={(e) =>
                                                            setSelected((prev) => ({ ...prev, [String(id)]: e.target.checked }))
                                                        }
                                                    />
                                                </TableCell>

                                                <TableCell className={cellClass}>
                                                    <img
                                                        src={p.thumbnail || p.image || "https://via.placeholder.com/40"}
                                                        alt={p.title}
                                                        className="h-10 w-10 rounded-lg object-cover border"
                                                    />
                                                </TableCell>

                                                <TableCell className={cn("font-medium", cellClass)}>{p.title}</TableCell>
                                                <TableCell className={cn("text-right", cellClass)}>{p.brand ?? "-"}</TableCell>

                                                <TableCell className={cn(cellClass)}>
                                                    <Badge variant="secondary">{p.category ?? "Unknown"}</Badge>
                                                </TableCell>

                                                <TableCell className={cn("text-right", cellClass)}>₹{(p.price ?? 0)}</TableCell>

                                                <TableCell className={cn("text-right", cellClass)}>
                                                    <Badge variant={(p.stock ?? 0) < 10 ? "destructive" : "outline"}>
                                                        {p.stock ?? 0}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className={cn("text-right", cellClass)}>{Number(p.rating ?? 0).toFixed(1)}</TableCell>

                                                <TableCell className={cn("text-right", cellClass)}>
                                                    <div className="inline-flex gap-2 justify-end">
                                                        <Button asChild size="sm" variant="outline" aria-label="View">
                                                            <Link to={`/products/${id}`}>View</Link>
                                                        </Button>

                                                        <Button asChild size="sm" variant="outline" aria-label="Edit">
                                                            <Link to={`/products/${id}/edit`}>Edit</Link>
                                                        </Button>

                                                        <Button
                                                            size="sm"
                                                            aria-label="Delete"
                                                            variant="destructive"
                                                            onClick={() => onDelete(p)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    )}

                    <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                        <div className="text-sm text-muted-foreground">
                            Page <span className="font-medium text-foreground">{page}</span> of{" "}
                            <span className="font-medium text-foreground">{totalPages}</span>
                        </div>

                        <div className="flex items-center gap-2" aria-label="Prev">
                            <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                                Prev
                            </Button >
                            <Button aria-label="Next" variant="outline" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
