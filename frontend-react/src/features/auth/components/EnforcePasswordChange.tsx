import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/shared/lib/axiosInstance";
import { isAdmin } from "@/shared/lib/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Eye, EyeOff, Lock } from "lucide-react";

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What city were you born in?",
  "What is your favorite food?",
  "What was the make of your first car?",
];

const schema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    securityQuestion: z.string().min(1, "Security question is required"),
    securityAnswer: z.string().min(3, "Security answer must be at least 3 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const EnforcePasswordChange: React.FC = () => {
  const navigate = useNavigate();
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
      securityQuestion: "",
      securityAnswer: "",
    },
  });

  const securityQuestion = watch("securityQuestion");

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setError(null);
    try {
      await api.post("/auth/enforce-password-change", {
        newPassword: data.newPassword,
        securityQuestion: data.securityQuestion,
        securityAnswer: data.securityAnswer,
      });
      localStorage.removeItem("pwChangeRequired");
      navigate(isAdmin() ? "/dashboard" : "/inventory");
    } catch (err: any) {
      const msg = err?.response?.data;
      setError(
        typeof msg === "string" ? msg : msg?.message || "Failed to change password. Please try again.",
      );
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
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Set Up Your Account
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              You must change your password and set up security credentials before continuing.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="font-semibold">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPw ? "text" : "password"}
                  placeholder="Enter new password"
                  {...register("newPassword")}
                  className={errors.newPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showNewPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.newPassword.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters including uppercase, lowercase, number, and special character.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-semibold">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Confirm new password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPw ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityQuestion" className="font-semibold">
                Security Question
              </Label>
              <Select
                onValueChange={(value) => setValue("securityQuestion", value, { shouldValidate: true })}
                value={securityQuestion}
              >
                <SelectTrigger id="securityQuestion" className={errors.securityQuestion ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select a security question" />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((question) => (
                    <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.securityQuestion && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.securityQuestion.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer" className="font-semibold">
                Security Answer
              </Label>
              <Input
                id="securityAnswer"
                type="text"
                placeholder="Enter your answer"
                {...register("securityAnswer")}
                className={errors.securityAnswer ? "border-destructive" : ""}
              />
              {errors.securityAnswer && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.securityAnswer.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Set Up Account"}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary"
              onClick={() => {
                localStorage.removeItem("authToken");
                localStorage.removeItem("pwChangeRequired");
              }}
            >
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnforcePasswordChange;
