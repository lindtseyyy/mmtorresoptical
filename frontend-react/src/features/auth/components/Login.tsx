import { useState, useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { LoginFormData } from "@/features/auth/types";
import axios from "axios";
import { useNavigate, useLocation, Link } from "react-router-dom";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import { Glasses, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import api from "@/shared/lib/axiosInstance";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [loginError, setLoginError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const resetSuccess = (location.state as { passwordReset?: boolean })?.passwordReset;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp > now) {
          navigate("/", { replace: true });
        }
      } catch {
        localStorage.removeItem("authToken");
      }
    }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setLoginError(null);

    try {
      const response = await api.post("/auth/login", data);

      // --- SUCCESS ---
      const { accessToken, isPwChangeRequired } = response.data;

      // Store the token (e.g., in localStorage)
      localStorage.setItem("authToken", accessToken);

      // Redirect based on password change requirement
      if (isPwChangeRequired) {
        navigate("/enforce-password-change");
      } else {
        navigate("/");
      }
    } catch (error) {
      // --- FAILURE ---
      if (axios.isAxiosError(error) && error.response) {
        // Check if the error is a 401 Unauthorized
        if (error.response.status === 401) {
          // Set the error message from the backend's response body
          // Your backend sends "Invalid credentials"
          setLoginError(error.response.data);
        } else {
          // Handle other server errors (e.g., 500)
          setLoginError(
            "An unexpected server error occurred. Please try again."
          );
        }
      } else {
        // Handle network errors (e.g., backend is not running)
        setLoginError(
          "Could not connect to the server. Please check your network."
        );
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-lg bg-card p-8 shadow-lg"
        >
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Glasses className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              MM Torres Optical
            </h1>
            <p className="text-sm text-muted-foreground">
              Optical Clinic Management System
            </p>
          </div>

          <div className="space-y-4">
            {/* Field 1: Username or Email */}
            <div className="space-y-2">
              <Label htmlFor="loginIdentifier" className="font-semibold">
                Username or Email
              </Label>
              <Input
                id="loginIdentifier"
                type="text"
                placeholder="Enter your username or email"
                {...register("loginIdentifier", {
                  required: "Username or email is required",
                })}
                className={errors.loginIdentifier ? "border-destructive" : ""}
              />
              {errors.loginIdentifier && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.loginIdentifier.message}
                </p>
              )}
            </div>

            {/* Field 2: Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className={errors.password ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {resetSuccess && (
            <div className="flex items-center justify-center rounded-md border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="mr-2 h-4 w-4" />
              Your password has been reset successfully. Please sign in.
            </div>
          )}

          {loginError && (
            <div
              className="flex items-center justify-center rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              {loginError}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing In..." : "Sign In"}
          </Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
