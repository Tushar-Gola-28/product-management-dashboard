import { api } from "../lib/api-client";

export const getUsersPaged = async ({ limit, skip, signal }: { limit: number; skip: number, signal: AbortSignal }) => {
    const res = await api.get(`/users?limit=${limit}&skip=${skip}`, { signal });
    return res.data;
};

export const searchUsers = async ({ q, limit, skip, signal }: { q: string; limit: number; skip: number, signal: AbortSignal }) => {
    const res = await api.get(`/users/search?q=${q}&limit=${limit}&skip=${skip}`, { signal: signal });
    return res.data;
};