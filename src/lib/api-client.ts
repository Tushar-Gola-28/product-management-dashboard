import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { showErrorToast } from "./toast";

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
});

let isRefreshing = false;
let failedQueue: {
    resolve: (token: string) => void;
    reject: (err: any) => void;
}[] = [];

const showOfflineIndicator = () => {
    showErrorToast("Network Error", "You are offline. Please check your internet.");
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token as string);
        }
    });

    failedQueue = [];
};

const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
};

const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};

const refreshTokenRequest = async () => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) throw new Error("No refresh token found");

    const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
        {
            refreshToken,
            expiresInMins: 1,
        },
    );

    return response.data;
};

// ✅ Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // ✅ Add timestamp for debugging
        config.headers["x-request-time"] = new Date().toISOString();

        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response interceptor (401 Refresh Flow)
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
            _retry?: boolean;
        };

        if (!error.response) {
            showOfflineIndicator();
            return Promise.reject(error);
        }

        const status = error.response.status;
        if (status === 500) {
            showErrorToast("Server Error", "Something went wrong. Please try again.");
            return Promise.reject(error);

        }
        if (status === 403) {
            showErrorToast("Access Denied", "You are not authorized to access this page.");
            window.location.replace("/login");
            return Promise.reject(error);
        }


        if (status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({
                        resolve: (token: string) => {
                            originalRequest.headers = {
                                ...originalRequest.headers,
                                Authorization: `Bearer ${token}`,
                            };
                            resolve(api(originalRequest));
                        },
                        reject: (err) => reject(err),
                    });
                });
            }


            isRefreshing = true;

            try {
                const data = await refreshTokenRequest();

                const newAccessToken = data?.accessToken;
                const newRefreshToken = data?.refreshToken;

                if (!newAccessToken || !newRefreshToken) {
                    throw new Error("Token refresh failed");
                }

                setTokens(newAccessToken, newRefreshToken);

                processQueue(null, newAccessToken);

                originalRequest.headers = {
                    ...originalRequest.headers,
                    Authorization: `Bearer ${newAccessToken}`,
                };

                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                clearTokens();
                showErrorToast("Session expired", "Please login again");
                window.location.replace("/login");
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export { api };
