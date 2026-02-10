import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuthValidator } from "../store";

type AuthGuardProps = {
    children: ReactNode;
    url: string;
    requiresAuth: boolean;
};

type AuthState = {
    isAuthenticate: boolean;
};

export const AuthGuard = ({ children, url, requiresAuth }: AuthGuardProps) => {
    const { isAuthenticate } = useAuthValidator((state: AuthState) => state);


    if (requiresAuth && !isAuthenticate) {
        return <Navigate to={url} replace />;
    }

    if (!requiresAuth && isAuthenticate) {
        return <Navigate to={url} replace />;
    }

    return children
};
