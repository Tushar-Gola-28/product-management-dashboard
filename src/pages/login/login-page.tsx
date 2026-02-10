import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Checkbox,
    Input,
} from "../../components/ui";
import { ThemeToggle } from "../../layouts";
import { showErrorToast, showSuccessToast } from "../../lib/toast";
import { useMutation } from "@tanstack/react-query";
import { loginApi } from "../../services";
import { useNavigate } from "react-router";
import { useAuthValidator, } from "../../store";

const loginSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean(),
});


export function LoginPage() {
    const navigate = useNavigate()
    const { handleAuthenticate, handleUserDetails } = useAuthValidator();
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    type LoginFormValues = z.infer<typeof loginSchema>;

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
        watch,
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
            rememberMe: false,
        },
    });
    const rememberMe = watch("rememberMe");

    useEffect(() => {
        const savedUsername = localStorage.getItem("remembered_username");
        if (savedUsername) {
            setValue("username", savedUsername);
            setValue("rememberMe", true);
        }
    }, [setValue]);

    const loginMutation = useMutation({
        mutationFn: loginApi,
        onSuccess: (res) => {
            localStorage.setItem("accessToken", res.accessToken);
            localStorage.setItem("refreshToken", res.refreshToken);
            showSuccessToast("Login Successful ✅", "Welcome back!");
            const { refreshToken, accessToken, ...rest } = res;
            handleAuthenticate(true)
            handleUserDetails(rest)
            navigate("/", { replace: true });
        },
        onError: (err: any) => {
            const message =
                err?.response?.data?.message || err?.message || "Something went wrong";

            setApiError(message);
            showErrorToast("Login Failed", message);
        },
    });

    const onSubmit: SubmitHandler<LoginFormValues> = (values) => {
        setApiError(null);

        if (values.rememberMe) {
            localStorage.setItem("remembered_username", values.username);
        } else {
            localStorage.removeItem("remembered_username");
        }

        loginMutation.mutate({
            username: values.username,
            password: values.password,
        });
    };


    return (
        <div
            className="relative flex min-h-screen w-full items-center justify-center px-4 overflow-hidden"
            style={{ backgroundColor: "var(--main-bg)" }}
        >
            <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-md border border-border/40 bg-background/70 backdrop-blur-xl shadow-2xl rounded-2xl">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>

                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Welcome Back
                    </CardTitle>

                    <CardDescription className="text-sm">
                        Login to access your dashboard
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {apiError && (
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                                {apiError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>

                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Enter username"
                                    className="pl-9"
                                    {...register("username")}
                                />
                            </div>

                            {errors.username && (
                                <p className="text-xs text-red-500">{errors.username.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>

                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter password"
                                    className="pr-10"
                                    {...register("password")}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="icons"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={rememberMe}
                                    onCheckedChange={(val) =>
                                        setValue("rememberMe", Boolean(val))
                                    }
                                />
                                <label className="text-sm font-medium cursor-pointer">
                                    Remember me
                                </label>
                            </div>

                            <button
                                type="button"
                                className="text-sm text-primary hover:underline"
                            >
                                Forgot password?
                            </button>
                        </div>

                        <Button type="submit" className="w-full h-11" disabled={loginMutation.isPending}>
                            {loginMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>

                        <p className="text-center text-xs text-muted-foreground">
                            By continuing, you agree to our{" "}
                            <span className="text-primary cursor-pointer hover:underline">
                                Terms
                            </span>{" "}
                            &{" "}
                            <span className="text-primary cursor-pointer hover:underline">
                                Privacy Policy
                            </span>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
