// src/components/forms/UserForm.tsx
import { useState, useMemo } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, type UserFormData } from "@/features/users/types";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Info, KeyRound } from "lucide-react";
import { z } from "zod";
import { resetPassword } from "@/features/users/services/userApi";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Label } from "@/shared/components/ui/label";

interface UserFormProps {
  defaultValues?: Partial<UserFormData>; // Partial for edit
  onFormSubmit: (data: UserFormData) => Promise<any>;
  isLoading: boolean;
  isEditMode: boolean;
  userId?: string;
  isPwChangeRequired?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  onFormSubmit,
  defaultValues,
  isLoading,
  isEditMode,
  userId,
  isPwChangeRequired,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resettingPw, setResettingPw] = useState(false);
  const [pwRequired, setPwRequired] = useState(isPwChangeRequired);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const handleResetPassword = () => {
    if (!userId) return;
    if (pwRequired) {
      toast.info("Already required", {
        description: "This user is already required to change their password on next login.",
      });
      return;
    }
    setTemporaryPassword("");
    setResetDialogOpen(true);
  };

  const handleConfirmReset = async () => {
    if (!userId || temporaryPassword.length < 8) return;
    setResettingPw(true);
    try {
      await resetPassword(userId, temporaryPassword);
      setPwRequired(true);
      setResetDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success("Password reset", {
        description: "User will be required to change their password on next login.",
      });
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setResettingPw(false);
    }
  };

  const maxBirthDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }, []);

  const formSchema = isEditMode
    ? userSchema.partial() // everything optional, including password
    : userSchema;

  // Infer type directly from schema
  type FormSchemaType = z.infer<typeof formSchema>;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      firstName: "",
      middleName: "",
      lastName: "",
      sex: "Male",
      birthDate: "",
      email: "",
      contactNumber: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "Staff",
    },
  });

  const { isDirty } = form.formState;

  // 👇 Add handleFormSubmit here
  const handleFormSubmit: SubmitHandler<FormSchemaType> = async (data) => {
    const { confirmPassword, ...rest } = data;
    const payload: UserFormData = {
      firstName: rest.firstName ?? "",
      middleName: rest.middleName ?? "",
      lastName: rest.lastName ?? "",
      sex: rest.sex ?? "Male",
      birthDate: rest.birthDate ?? "",
      email: rest.email ?? "",
      contactNumber: rest.contactNumber ?? "",
      username: rest.username ?? "",
      password: rest.password ?? "",
      role: rest.role ?? "Staff",
      confirmPassword: rest.password ?? "",
      isArchived: false,
    };

    await onFormSubmit(payload);
  };

  return (
    <>
      <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Personal Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Enter user's personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter middle name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Date *</FormLabel>
                    <FormControl>
                      <Input type="date" max={maxBirthDate} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Set up login credentials and role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Enter contact number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Administrator</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {!isEditMode && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {!isEditMode && (
              <div className="flex items-start gap-2 rounded-md border bg-blue-50/50 p-3 text-sm text-blue-800/80 dark:bg-blue-950/30 dark:text-blue-300/70">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  The user will be required to change their password at their
                  first login.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Information Card — edit mode only */}
        {isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle>Security Information</CardTitle>
              <CardDescription>
                Manage account recovery and password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Force the user to change their password on next login
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={resettingPw}
                  >
                    <KeyRound className="mr-1 h-4 w-4" />
                    {resettingPw ? "Resetting..." : "Reset Password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isLoading || (isEditMode && !isDirty)}>
            {isLoading
              ? isEditMode
                ? "Saving..."
                : "Creating..."
              : isEditMode
              ? "Save Changes"
              : "Create User"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/users")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a temporary password for the user. They will be required to
              change it upon next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="temporaryPassword">Temporary Password</Label>
            <Input
              id="temporaryPassword"
              type="text"
              placeholder="Enter temporary password (min. 8 characters)"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingPw}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleConfirmReset}
              disabled={resettingPw || temporaryPassword.length < 8}
            >
              {resettingPw ? "Resetting..." : "Reset Password"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
