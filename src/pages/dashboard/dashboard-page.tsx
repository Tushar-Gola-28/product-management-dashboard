import { Link } from "react-router";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";

import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

import {
    Package,
    Users,
    AlertTriangle,
    IndianRupee,
    Star,
    Layers,
} from "lucide-react";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui";
import { Skeleton } from "../../components/ui/skeleton";
import { useFunction } from "./hooks/use-api-calls";

export function DashboardPage() {

    const { recentProducts, topRatedProducts, priceRangeData, productsByCategory, stats, isLoading, totalProducts, totalUsers } = useFunction()

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Stats Skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <Card key={idx} className="rounded-2xl shadow-sm">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-2 w-full">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-32" />
                                </div>

                                <Skeleton className="h-10 w-10 rounded-xl" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Charts Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <Skeleton className="h-5 w-48" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {Array.from({ length: 4 }).map((_, idx) => (
                                    <Skeleton key={idx} className="h-10 w-full rounded-lg" />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader>
                            <Skeleton className="h-5 w-52" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-[250px] w-full rounded-xl" />
                        </CardContent>
                    </Card>
                </div>

                {/* Top Rated Products Skeleton */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <Skeleton className="h-5 w-56" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full rounded-xl" />
                    </CardContent>
                </Card>

                {/* Recent Products Table Skeleton */}
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-5 w-44" />
                        <Skeleton className="h-8 w-24 rounded-md" />
                    </CardHeader>

                    <CardContent>
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-4 border rounded-lg p-3"
                                >
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <Skeleton className="h-4 w-[40%]" />
                                    <Skeleton className="h-4 w-[20%]" />
                                    <Skeleton className="h-4 w-[10%]" />
                                    <Skeleton className="h-4 w-[10%]" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Products"
                    value={totalProducts}
                    icon={<Package size={20} />}
                />

                <StatCard
                    title="Total Users"
                    value={totalUsers}
                    icon={<Users size={20} />}
                />

                <StatCard
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    icon={<AlertTriangle size={20} />}
                />

                <StatCard
                    title="Average Price"
                    value={`₹${stats.avgPrice.toFixed(2)}`}
                    icon={<IndianRupee size={20} />}
                />

                <StatCard
                    title="Average Rating"
                    value={stats.avgRating.toFixed(1)}
                    icon={<Star size={20} />}
                />

                <StatCard
                    title="Categories Count"
                    value={stats.categoriesCount}
                    icon={<Layers size={20} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Products by Category</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="h-62.5">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={productsByCategory}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        outerRadius={100}
                                    >
                                        {productsByCategory.map((_, index) => (
                                            <Cell key={index} />
                                        ))}
                                    </Pie>

                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {productsByCategory.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="h-3 w-3 rounded-full bg-primary" />
                                        <span className="font-medium capitalize">{item.name}</span>
                                    </div>

                                    <span className="text-muted-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>


                <Card className="rounded-2xl shadow-sm">
                    <CardHeader>
                        <CardTitle>Price Range Distribution</CardTitle>
                    </CardHeader>

                    <CardContent className="h-75">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceRangeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="range" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                    <CardTitle>Top 10 Rated Products</CardTitle>
                </CardHeader>

                <CardContent className="h-87.5">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topRatedProducts}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="title" width={150} />
                            <Tooltip />
                            <Bar dataKey="rating" radius={[0, 8, 8, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Products</CardTitle>
                    <Button aria-label="view all" asChild variant="outline" size="sm">
                        <Link to="/products">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Rating</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentProducts.map((p: any) => (
                                    <TableRow key={p.id || p._id}>
                                        <TableCell>
                                            <img
                                                src={p.thumbnail || p.image || "https://via.placeholder.com/50"}
                                                alt={p.title}
                                                className="h-10 w-10 rounded-lg object-cover border"
                                            />
                                        </TableCell>

                                        <TableCell className="font-medium">{p.title}</TableCell>

                                        <TableCell>
                                            <Badge variant="secondary">{p.category}</Badge>
                                        </TableCell>

                                        <TableCell>₹{p.price}</TableCell>

                                        <TableCell>
                                            <Badge variant={p.stock < 10 ? "destructive" : "outline"}>
                                                {p.stock}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="flex items-center gap-1">
                                            <Star size={14} className="text-yellow-500" />
                                            {p.rating || 0}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
}: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <h2 className="text-xl font-bold">{value}</h2>
                </div>

                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted">
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}
