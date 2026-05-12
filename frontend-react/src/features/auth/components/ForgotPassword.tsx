import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/shared/lib/axiosInstance";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Eye, EyeOff, HelpCircle, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

const answerSchema = z.object({
  securityAnswer: z.string().min(1, "Answer is required"),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type AnswerFormData = z.infer<typeof answerSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });
  const answerForm = useForm<AnswerFormData>({ resolver: zodResolver(answerSchema) });
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onEmailSubmit: SubmitHandler<EmailFormData> = async (data) => {
    setError(null);
    try {
      const response = await api.post("/auth/forgot-password/question", { email: data.email });
      if (response.data.securityQuestion) {
        setEmail(data.email);
        setSecurityQuestion(response.data.securityQuestion);
        setStep(2);
      } else {
        setError("No account found with that email address.");
      }
    } catch {
      setError("Unable to process your request. Please try again.");
    }
  };

  const onAnswerSubmit: SubmitHandler<AnswerFormData> = async (data) => {
    setError(null);
    try {
      await api.post("/auth/forgot-password/verify", {
        email,
        securityAnswer: data.securityAnswer,
      });
      setSecurityAnswer(data.securityAnswer);
      setStep(3);
    } catch (err: any) {
      const msg = err?.response?.data;
      setError(typeof msg === "string" ? msg : "Incorrect answer. Please try again.");
    }
  };

  const onPasswordSubmit: SubmitHandler<PasswordFormData> = async (data) => {
    setError(null);
    try {
      await api.post("/auth/forgot-password/reset", {
        email,
        securityAnswer,
        newPassword: data.newPassword,
      });
      navigate("/login", { state: { passwordReset: true } });
    } catch (err: any) {
      const msg = err?.response?.data;
      setError(typeof msg === "string" ? msg : "Failed to reset password. Please try again.");
    }
  };

  const stepIcons = {
    1: HelpCircle,
    2: ShieldCheck,
    3: Lock,
  };

  const stepTitles = {
    1: "Forgot Password",
    2: "Security Question",
    3: "New Password",
  };

  const stepSubtitles = {
    1: "Enter your email to recover your account.",
    2: "Answer your security question to verify your identity.",
    3: "Choose a new password for your account.",
  };

  const Icon = stepIcons[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md p-8">
        <div className="space-y-6 rounded-lg bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <Icon className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {stepTitles[step]}
            </h1>
            <p className="text-center text-sm text-muted-foreground">
              {stepSubtitles[step]}
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div
                key={s}
                className={`h-2 w-2 rounded-full ${
                  s === step
                    ? "bg-primary"
                    : s < step
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  {...emailForm.register("email")}
                  className={emailForm.formState.errors.email ? "border-destructive" : ""}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive" role="alert">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={emailForm.formState.isSubmitting}
              >
                {emailForm.formState.isSubmitting ? "Checking..." : "Continue"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* Step 2: Security Question */}
          {step === 2 && (
            <form onSubmit={answerForm.handleSubmit(onAnswerSubmit)} className="space-y-4">
              <div className="rounded-md bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">{securityQuestion}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="securityAnswer" className="font-semibold">
                  Your Answer
                </Label>
                <Input
                  id="securityAnswer"
                  type="text"
                  placeholder="Enter your answer"
                  {...answerForm.register("securityAnswer")}
                  className={answerForm.formState.errors.securityAnswer ? "border-destructive" : ""}
                />
                {answerForm.formState.errors.securityAnswer && (
                  <p className="text-xs text-destructive" role="alert">
                    {answerForm.formState.errors.securityAnswer.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={answerForm.formState.isSubmitting}
              >
                {answerForm.formState.isSubmitting ? "Verifying..." : "Verify Answer"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(null); }}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Try a different email
                </button>
              </div>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="font-semibold">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPw ? "text" : "password"}
                    placeholder="Enter new password"
                    {...passwordForm.register("newPassword")}
                    className={passwordForm.formState.errors.newPassword ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
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
                    {...passwordForm.register("confirmPassword")}
                    className={passwordForm.formState.errors.confirmPassword ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive" role="alert">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep(2); setError(null); }}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
