import {
    LayoutDashboard,
    Package,
    Users,
    Settings,
} from "lucide-react";

export const navItems = [
    {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
    },
    {
        label: "Products",
        path: "/products",
        icon: Package,
    },
    {
        label: "Users",
        path: "/users",
        icon: Users,
    },
    {
        label: "Settings",
        path: "/settings",
        icon: Settings,
    },
];
