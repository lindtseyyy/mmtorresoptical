import api from "@/shared/lib/axiosInstance";
import type { UserProfile, ProfileFormData, ChangePasswordFormData, SecurityQuestionFormData } from "@/features/profile/types";

const mapProfileFromBackend = (data: UserProfile): UserProfile => ({
  ...data,
  sex: data.sex.charAt(0) + data.sex.slice(1).toLowerCase(),
});

export const fetchOwnProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get("/users/me");
  return mapProfileFromBackend(data);
};

export const updateOwnProfile = async (formData: ProfileFormData) => {
  const payload = { ...formData, sex: formData.sex.toUpperCase() };
  const { data } = await api.put("/users/me", payload);
  return mapProfileFromBackend(data);
};

export const changeOwnPassword = async (formData: ChangePasswordFormData) => {
  await api.post("/auth/change-password", {
    currentPassword: formData.currentPassword,
    newPassword: formData.newPassword,
  });
};

export const updateOwnSecurityQuestion = async (formData: SecurityQuestionFormData) => {
  await api.patch("/users/me/security-question", formData);
};
