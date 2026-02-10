import { Outlet } from 'react-router'
import { urls } from './urls'
import { AuthGuard, LoadingCallBack } from '../helpers'
import { MainLayout } from '../layouts'
import { lazy, Suspense, type JSX } from 'react'
import { DashboardPage } from '../pages'
import { ProductDetailsPage } from '../pages/product/product-details-page'
// import { UsersPage } from '../pages/users/users-page'
// import { ProductEditPage } from '../pages/product/product-edit-page'
const LoginPage = lazy(() =>
    import("../pages").then((m) => ({ default: m.LoginPage }))
);
const ProductPage = lazy(() =>
    import("../pages").then((m) => ({ default: m.ProductPage }))
);
const ProductCreatePage = lazy(() =>
    import("../pages").then((m) => ({ default: m.ProductCreatePage }))
);
const EditProductPage = lazy(() =>
    import("../pages").then((m) => ({ default: m.EditProductPage }))
);
const UsersPage = lazy(() =>
    import("../pages").then((m) => ({ default: m.UsersPage }))
);
const SettingsPage = lazy(() =>
    import("../pages").then((m) => ({ default: m.SettingsPage }))
);

const withSuspense = (Component: JSX.Element) => (
    <Suspense fallback={<LoadingCallBack />}>{Component}</Suspense>
);

export const root = [
    {
        path: urls.LOGIN,
        element: (
            <AuthGuard url={urls.BASE_URL} requiresAuth={false}>
                <Outlet />
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: withSuspense(<LoginPage />),
                handle: {
                    crumb: () => ({ label: "Login" }),
                },
            },
        ],
    },

    {
        path: urls.BASE_URL,
        element: (
            <AuthGuard url={urls.LOGIN} requiresAuth={true}>
                <MainLayout />
            </AuthGuard>
        ),
        children: [
            {
                index: true,
                element: <DashboardPage />,
                handle: {
                    crumb: () => ({ label: "Dashboard" }),
                },
            },

            {
                path: urls.USERS,
                element: withSuspense(<UsersPage />),
                handle: {
                    crumb: () => ({ label: "Users" }),
                },
            },

            {
                path: urls.SETTINGS,
                element: withSuspense(<SettingsPage />),
                handle: {
                    crumb: () => ({ label: "Settings" }),
                },
            },

            {
                path: urls.PRODUCTS,
                handle: {
                    crumb: () => ({ label: "Products" }),
                },
                children: [
                    {
                        index: true,
                        element: withSuspense(<ProductPage />),
                    },

                    {
                        path: urls.PRODUCTS_NEW,
                        element: withSuspense(<ProductCreatePage />),
                        handle: {
                            crumb: () => ({ label: "Create Product" }),
                        },
                    },

                    {
                        path: urls.PRODUCTS_EDIT,
                        element: withSuspense(<EditProductPage />),
                        handle: {
                            crumb: () => ({ label: "Edit Product" }),
                        },
                    },

                    {
                        path: urls.PRODUCTS_VIEW,
                        element: withSuspense(<ProductDetailsPage />),
                        handle: {
                            crumb: () => ({ label: "Product Details" }),
                        },
                    },
                ],
            },
        ],
    },
];

