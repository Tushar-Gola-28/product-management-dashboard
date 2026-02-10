import { api } from "../lib/api-client";

export const getUsersPaged = async ({ limit, skip }: { limit: number; skip: number }) => {
    const res = await api.get(`/users?limit=${limit}&skip=${skip}`);
    return res.data;
};

export const searchUsers = async ({ q, limit, skip }: { q: string; limit: number; skip: number }) => {
    const res = await api.get(`/users/search?q=${q}&limit=${limit}&skip=${skip}`);
    return res.data;
};