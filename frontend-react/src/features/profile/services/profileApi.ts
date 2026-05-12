import api from "@/shared/lib/axiosInstance";
import type { UserProfile, ProfileFormData, ChangePasswordFormData, SecurityQuestionFormData } from "@/features/profile/types";

const GENDER_TO_BACKEND: Record<string, string> = {
  Male: "MALE",
  Female: "FEMALE",
  Other: "OTHERS",
};

const GENDER_FROM_BACKEND: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHERS: "Other",
};

const mapProfileFromBackend = (data: UserProfile): UserProfile => ({
  ...data,
  gender: GENDER_FROM_BACKEND[data.gender] ?? data.gender,
});

export const fetchOwnProfile = async (): Promise<UserProfile> => {
  const { data } = await api.get("/users/me");
  return mapProfileFromBackend(data);
};

export const updateOwnProfile = async (formData: ProfileFormData) => {
  const payload = { ...formData };
  if (payload.gender && GENDER_TO_BACKEND[payload.gender]) {
    payload.gender = GENDER_TO_BACKEND[payload.gender];
  }
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
