export const urls = {
    BASE_URL: "/",
    LOGIN: "/login",
    DASHBOARD: "/dashboard",
    PRODUCTS: "/products",
    PRODUCTS_NEW: "/products/new",
    PRODUCTS_EDIT: "/products/:id/edit",
    PRODUCTS_VIEW: "/products/:id",
    USERS: "/users",
    SETTINGS: "/settings",
} as const;

export type Urls = typeof urls[keyof typeof urls];
