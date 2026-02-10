import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useEffect, useMemo, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Container } from "../components";
import { navItems } from "./nav-items";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "../components/ui/sidebar";

import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { useMatches } from "react-router";

import {
    Search,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
} from "lucide-react";

import { api } from "../lib/api-client";
import { useAuthValidator } from "../store";
import { useDebouncedValue } from "../hooks/use-debounced-value";

type User = {
    firstName: string;
    email: string;
};

type RouteMatch = {
    pathname: string;
    handle?: {
        crumb?: (match: any) => { label: string };
    };
};

export function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { handleAuthenticate, user: safeUser, handleUserDetails } = useAuthValidator();
    const user = safeUser as User | null;
    const matches = useMatches();

    const breadcrumbs = useMemo(() => {
        return (matches as RouteMatch[])
            .filter((m) => m.handle?.crumb)
            .map((m) => m.handle!.crumb!(m));
    }, [matches]);


    const [theme] = useState(localStorage.getItem("theme") || "light");

    const [sidebarOpen, setSidebarOpen] = useState(() => {
        try {
            const raw = localStorage.getItem("app_settings_v1");
            if (!raw) return true;

            const parsed = JSON.parse(raw);
            return parsed.sidebar === "collapsed" ? false : true;
        } catch {
            return true;
        }
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        localStorage.setItem("theme", theme);
    }, [theme]);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            if (width >= 768 && width <= 1023) {
                setSidebarOpen(false);
                return;
            }

            if (width >= 1024) {
                try {
                    const raw = localStorage.getItem("app_settings_v1");
                    if (!raw) return;

                    const parsed = JSON.parse(raw);
                    setSidebarOpen(parsed.sidebar === "collapsed" ? false : true);
                } catch {
                    setSidebarOpen(true);
                }
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSidebarToggle = (val: boolean) => {
        setSidebarOpen(val);

        try {
            const raw = localStorage.getItem("app_settings_v1");
            const prev = raw ? JSON.parse(raw) : {};

            const next = {
                ...prev,
                sidebar: val ? "expanded" : "collapsed",
            };

            localStorage.setItem("app_settings_v1", JSON.stringify(next));
        } catch {
            localStorage.setItem(
                "app_settings_v1",
                JSON.stringify({ sidebar: val ? "expanded" : "collapsed" })
            );
        }
    };

    const pageTitle = useMemo(() => {
        const current = navItems.find((item) =>
            location.pathname.startsWith(item.path)
        );
        return current?.label || "Dashboard";
    }, [location.pathname]);

    const [search, setSearch] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);
    const searchRef = useRef<HTMLDivElement | null>(null);

    const debouncedSearch = useDebouncedValue(search, 400);

    const searchQuery = useQuery({
        queryKey: ["global-search-products", debouncedSearch],
        queryFn: async () => {
            const res = await api.get(`/products/search?q=${debouncedSearch}`);
            return res.data?.products || res.data || [];
        },
        enabled: debouncedSearch.length >= 2,
    });

    const products = searchQuery.data ?? [];
    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (!searchRef.current) return;
            if (!searchRef.current.contains(e.target)) {
                setShowSearchBox(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const onSelectProduct = (id: string | number) => {
        setSearch("");
        setShowSearchBox(false);
        navigate(`/products/${id}`);
    };
    const handleLogout = async () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        await queryClient.clear();

        handleAuthenticate(false);
        handleUserDetails(null);
        navigate("/login", { replace: true });
    };

    return (
        <SidebarProvider
            defaultOpen={sidebarOpen}
            open={sidebarOpen}
            onOpenChange={handleSidebarToggle}
        >
            <Sidebar collapsible="icon" className="border-r bg-background">
                <SidebarHeader className="border-b group">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                            <LayoutDashboard className="text-primary" size={18} />
                        </div>

                        <div className="flex flex-col leading-tight transition-all duration-200 group-data-[collapsible=icon]:hidden">
                            <h2 className="font-bold text-base tracking-tight">
                                Admin Panel
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Manage everything
                            </p>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent className="py-4">
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu className="space-y-1">
                                {navItems.map((item) => {
                                    const active = location.pathname.startsWith(item.path);
                                    const Icon = item.icon;

                                    return (
                                        <SidebarMenuItem key={item.label}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={active}
                                                className={`rounded-xl px-3 py-2 transition-all ${active
                                                    ? "bg-primary/15 text-primary font-semibold"
                                                    : "hover:bg-muted"
                                                    }`}
                                            >
                                                <Link to={item.path} className="flex items-center gap-3">
                                                    <Icon size={18} />
                                                    <span className="text-sm">{item.label}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="border-t p-4">
                    <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">© 2026 Project</div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            v1.0
                        </span>
                    </div>
                </SidebarFooter>
            </Sidebar>

            {/* Main Content */}
            <SidebarInset>
                {/* Header */}
                <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
                    {/* Left */}
                    <div className="flex items-center gap-3">
                        <SidebarTrigger />

                        <div className="flex flex-col leading-tight">
                            <h1 className="text-base font-semibold tracking-tight">
                                {pageTitle}
                            </h1>

                            <div className="text-xs text-muted-foreground flex gap-1 flex-wrap">
                                {breadcrumbs.map((b, idx) => (
                                    <span key={b.label} className="capitalize">
                                        {idx !== 0 && " / "}
                                        {b.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div
                        ref={searchRef}
                        className="hidden lg:flex relative flex-col w-[420px]"
                    >
                        <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-2xl border">
                            <Search size={18} className="text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setShowSearchBox(true);
                                }}
                                placeholder="Search products..."
                                className="border-0 shadow-none focus-visible:ring-0 bg-transparent h-7 text-sm"
                            />
                        </div>

                        {/* Dropdown */}
                        {showSearchBox && search.length >= 2 && (
                            <div className="absolute top-[52px] w-full rounded-2xl border bg-background shadow-xl overflow-hidden z-50">
                                {searchQuery.isLoading ? (
                                    <div className="p-4 text-sm text-muted-foreground">
                                        Searching...
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="p-4 text-sm text-muted-foreground">
                                        No product found
                                    </div>
                                ) : (
                                    <div className="max-h-[320px] overflow-y-auto">
                                        {products.map((p: any) => (
                                            <button
                                                key={p.id || p._id}
                                                onClick={() => onSelectProduct(p.id || p._id)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition text-left"
                                            >
                                                <img
                                                    src={p.thumbnail || p.image}
                                                    alt={p.title}
                                                    className="h-10 w-10 rounded-xl border object-cover"
                                                />

                                                <div className="flex flex-col flex-1">
                                                    <p className="text-sm font-semibold">{p.title}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.brand || "No brand"} • ₹{p.price}
                                                    </p>
                                                </div>

                                                <span className="text-xs text-muted-foreground">
                                                    Stock: {p.stock ?? 0}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button aria-label="User" className="flex items-center gap-3 rounded-2xl border px-3 py-2 hover:bg-muted transition">
                                    <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        {user?.firstName?.[0] || ""}
                                    </div>

                                    <div className="hidden md:flex flex-col items-start leading-tight">
                                        <p className="text-sm font-semibold">{user?.firstName || "Unknown User"}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {user?.email}
                                        </p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem className="cursor-pointer">
                                    <User size={16} className="mr-2" /> Profile
                                </DropdownMenuItem>

                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link to="/settings" className="flex items-center">
                                        <Settings size={16} className="mr-2" /> Settings
                                    </Link>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                                    <LogOut size={16} className="mr-2" /> Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Main */}
                <main className="relative flex-1 overflow-hidden">
                    <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

                    <Container>
                        <Outlet />
                    </Container>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
