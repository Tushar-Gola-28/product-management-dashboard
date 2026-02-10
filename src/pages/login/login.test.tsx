import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginPage } from "./login-page";

const mockNavigate = vi.fn();
const mockMutate = vi.fn();

vi.mock("react-router", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../../lib/toast", () => ({
    showSuccessToast: vi.fn(),
    showErrorToast: vi.fn(),
}));

vi.mock("../../services", () => ({
    loginApi: vi.fn(),
}));

vi.mock("../../store", () => ({
    useAuthValidator: () => ({
        handleAuthenticate: vi.fn(),
        handleUserDetails: vi.fn(),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
    useMutation: (options: any) => {
        return {
            mutate: (data: { username: string; password: string }) => {
                mockMutate(data);

                if (data.username === "emilys") {
                    options.onSuccess({
                        accessToken: "access-token",
                        refreshToken: "refresh-token",
                        name: "John",
                        email: "admin@gmail.com",
                        role: "admin",
                    });
                } else {
                    options.onError({
                        message: "Invalid Credentials",
                        response: {
                            data: {
                                message: "Wrong username or password",
                            },
                        },
                    });
                }
            },
            isPending: false,
        };
    },
}));

describe("LoginPage Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it("should render login form correctly", () => {
        render(<LoginPage />);

        expect(screen.getByText("Welcome Back")).toBeInTheDocument();
        expect(
            screen.getByText("Login to access your dashboard")
        ).toBeInTheDocument();

        expect(screen.getByPlaceholderText("Enter username")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("Enter password")).toBeInTheDocument();

        expect(screen.getByText("Remember me")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });

    it("should show validation error if username is less than 3 characters", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText("Enter username"), "ab");
        await user.type(screen.getByPlaceholderText("Enter password"), "123456");

        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(
            await screen.findByText("Username must be at least 3 characters")
        ).toBeInTheDocument();
    });

    it("should show validation error if password is less than 6 characters", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText("Enter username"), "admin");
        await user.type(screen.getByPlaceholderText("Enter password"), "123");

        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(
            await screen.findByText("Password must be at least 6 characters")
        ).toBeInTheDocument();
    });

    it("should remove username from localStorage if Remember me is unchecked", async () => {
        localStorage.setItem("remembered_username", "oldUser");

        const user = userEvent.setup();
        render(<LoginPage />);

        const usernameInput = screen.getByPlaceholderText("Enter username");
        await user.clear(usernameInput);
        await user.type(usernameInput, "admin");

        await user.type(screen.getByPlaceholderText("Enter password"), "123456");

        // rememberMe is auto-true because localStorage had value, so uncheck it
        const checkbox = screen.getByRole("checkbox");
        await user.click(checkbox);

        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(localStorage.getItem("remembered_username")).toBe(null);
    });


    it("should auto-fill username if remembered_username exists in localStorage", async () => {
        localStorage.setItem("remembered_username", "savedUser");

        render(<LoginPage />);

        const usernameInput = screen.getByPlaceholderText("Enter username");

        await waitFor(() => {
            expect(usernameInput).toHaveValue("savedUser");
        });
    });

    it("should login successfully and navigate to dashboard", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText("Enter username"), "emilys");
        await user.type(screen.getByPlaceholderText("Enter password"), "emilyspass");

        await user.click(screen.getByRole("button", { name: "Login" }));

        await waitFor(() => {
            expect(localStorage.getItem("accessToken")).toBe("access-token");
            expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
        });

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
        });
    });

    it("should show API error if login fails", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText("Enter username"), "wronguser");
        await user.type(screen.getByPlaceholderText("Enter password"), "123456");

        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(
            await screen.findByText("Wrong username or password")
        ).toBeInTheDocument();
    });

    it("should call mutate with correct payload", async () => {
        const user = userEvent.setup();
        render(<LoginPage />);

        await user.type(screen.getByPlaceholderText("Enter username"), "emilys");
        await user.type(screen.getByPlaceholderText("Enter password"), "emilyspass");

        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(mockMutate).toHaveBeenCalledWith({
            username: "emilys",
            password: "emilyspass",
        });
    });
});
