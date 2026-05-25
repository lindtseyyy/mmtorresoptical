import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const roleMap: Record<string, string> = { ADMIN: "Administrator", STAFF: "Staff" };

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

import {
  profileSchema,
  changePasswordSchema,
  securityQuestionSchema,
  type ProfileFormData,
  type ChangePasswordFormData,
  type SecurityQuestionFormData,
} from "@/features/profile/types";
import {
  fetchOwnProfile,
  updateOwnProfile,
  changeOwnPassword,
  updateOwnSecurityQuestion,
} from "@/features/profile/services/profileApi";

const EditProfile: React.FC = () => {
  const queryClient = useQueryClient();

  // --- Fetch profile ---
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["ownProfile"],
    queryFn: fetchOwnProfile,
  });

  // --- Profile form ---
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile
      ? {
          firstName: profile.firstName,
          middleName: profile.middleName ?? "",
          lastName: profile.lastName,
          sex: profile.sex as "Male" | "Female",
          birthDate: profile.birthDate,
          email: profile.email,
          contactNumber: profile.contactNumber,
        }
      : undefined,
  });

  const { isPending: isSavingProfile, mutateAsync: saveProfile } = useMutation({
    mutationFn: updateOwnProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["ownProfile"], data);
      toast.success("Profile updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update profile"),
  });

  const onSaveProfile: SubmitHandler<ProfileFormData> = async (data) => {
    await saveProfile(data);
  };

  // --- Password form ---
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const passwordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const { isPending: isChangingPw, mutateAsync: changePw } = useMutation({
    mutationFn: changeOwnPassword,
    onSuccess: () => {
      passwordForm.reset();
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to change password"),
  });

  const onChangePassword: SubmitHandler<ChangePasswordFormData> = async (data) => {
    await changePw(data);
  };

  // --- Security question form ---
  const [showSecPw, setShowSecPw] = useState(false);
  const [secFormKey, setSecFormKey] = useState(0);

  const securityForm = useForm<SecurityQuestionFormData>({
    resolver: zodResolver(securityQuestionSchema),
    defaultValues: { currentPassword: "", securityQuestion: "", securityAnswer: "" },
  });

  useEffect(() => {
    if (profile) {
      securityForm.reset({
        currentPassword: "",
        securityQuestion: profile.securityQuestion ?? "",
        securityAnswer: "",
      });
      setSecFormKey((k) => k + 1);
    }
  }, [profile, securityForm]);

  const { isPending: isSavingSecurity, mutateAsync: saveSecurity } = useMutation({
    mutationFn: updateOwnSecurityQuestion,
    onSuccess: () => {
      securityForm.reset();
      toast.success("Security question updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update security question"),
  });

  const onSaveSecurity: SubmitHandler<SecurityQuestionFormData> = async (data) => {
    await saveSecurity(data);
  };

  // --- Loading state ---
  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Edit Profile</h2>
        <p className="text-muted-foreground">Manage your personal information and account security</p>
      </div>

      {/* Profile Information */}
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)}>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={profileForm.control}
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
                  control={profileForm.control}
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
                  control={profileForm.control}
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
                  control={profileForm.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                  control={profileForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter contact number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingProfile}>
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Account Information (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your account credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Username</p>
              <p className="text-sm text-muted-foreground">{profile?.username}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">{roleMap[profile?.role?.toUpperCase() ?? ""] ?? profile?.role ?? "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Form {...passwordForm}>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)}>
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showCurrentPw ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showNewPw ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showConfirmPw ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isChangingPw}>
                  {isChangingPw ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Security Question */}
      <Form {...securityForm}>
        <form onSubmit={securityForm.handleSubmit(onSaveSecurity)}>
          <Card>
            <CardHeader>
              <CardTitle>Security Question</CardTitle>
              <CardDescription>Update your account recovery credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={securityForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showSecPw ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowSecPw(!showSecPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showSecPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="securityQuestion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Question *</FormLabel>
                    <Select
                      key={`sec-q-${secFormKey}`}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="What is your mother's maiden name?">
                          What is your mother's maiden name?
                        </SelectItem>
                        <SelectItem value="What was the name of your first pet?">
                          What was the name of your first pet?
                        </SelectItem>
                        <SelectItem value="What was the name of your first school?">
                          What was the name of your first school?
                        </SelectItem>
                        <SelectItem value="What is your favorite book?">
                          What is your favorite book?
                        </SelectItem>
                        <SelectItem value="What city were you born in?">
                          What city were you born in?
                        </SelectItem>
                        <SelectItem value="What is your favorite food?">
                          What is your favorite food?
                        </SelectItem>
                        <SelectItem value="What was the make of your first car?">
                          What was the make of your first car?
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={securityForm.control}
                name="securityAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Answer *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your answer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSavingSecurity}>
                  {isSavingSecurity ? "Saving..." : "Update Security Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
};

export default EditProfile;
