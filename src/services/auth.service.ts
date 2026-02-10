import { api } from "../lib/api-client";

export const loginApi = async (payload: {
    username: string;
    password: string;
}) => {
    const response = await api.post("/auth/login", {
        ...payload,
        expiresInMins: 1,
    });

    return response.data;
};
