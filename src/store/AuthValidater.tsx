import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInterFace {
    id?: string;
    name?: string;
    email?: string;
    profile?: string;
    [key: string]: unknown;
}

interface AuthState {
    isAuthenticate: boolean;
    user: UserInterFace | null;
    handleAuthenticate: (value: boolean) => void;
    handleUserInterFaceDetails: (value: UserInterFace) => void;
}

export const useAuthValidator = create<AuthState>()(
    persist(
        (set) => ({
            isAuthenticate: false,
            user: null,
            handleAuthenticate: (value: boolean) =>
                set(() => ({ isAuthenticate: value })),
            handleUserDetails: (value: UserInterFace) =>
                set(() => ({ user: value })),
        }),
        {
            name: "auth-storage",
            getStorage: () => localStorage,
        }
    )
);
