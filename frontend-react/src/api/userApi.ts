import type {User, UserFormData, PageResponse, UserSummary} from "@/types";
import api from "@/lib/axiosInstance";

// Backend enums use uppercase; frontend uses title case
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

const ROLE_TO_BACKEND: Record<string, string> = {
  Admin: "ADMIN",
  Staff: "STAFF",
};

const ROLE_FROM_BACKEND: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

const mapEnumsToBackend = (data: { gender?: string; role?: string }) => {
  if (data.gender && GENDER_TO_BACKEND[data.gender]) {
    data.gender = GENDER_TO_BACKEND[data.gender];
  }
  if (data.role && ROLE_TO_BACKEND[data.role]) {
    data.role = ROLE_TO_BACKEND[data.role];
  }
};

const mapUserFromBackend = (user: User): User => ({
  ...user,
  gender: GENDER_FROM_BACKEND[user.gender] ?? user.gender,
  role: (ROLE_FROM_BACKEND[user.role] ?? user.role) as User["role"],
});

// API call to fetch users (backend returns Page<UserDetailsDTO>)
const fetchUsers = async (
  page = 0,
  size = 10,
  keyword?: string,
  sortBy = "fullNameSortable",
  sortOrder = "asc",
): Promise<PageResponse<User>> => {
  const { data } = await api.get("/admin/users", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      ...(keyword && { keyword }),
    },
  });
  return {
    content: data.content.map(mapUserFromBackend),
    totalPages: data.page.totalPages,
    totalElements: data.page.totalElements,
    size: data.page.size,
    number: data.page.number,
  };
};

// API call to get one user
const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get(`/admin/users/${id}`);
  return mapUserFromBackend(data);
};

// API call to archive a user
const archiveUser = async (id: string) => {
  return await api.delete(`/admin/users/${id}`);
};

// API call to register a new user
const registerUser = async (data: UserFormData) => {
  mapEnumsToBackend(data);
  return await api.post("/admin/users", data);
};

// API call to update a user
const updateUser = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<UserFormData>;
}) => {
  mapEnumsToBackend(data);
  // Strip fields not accepted by UpdateUserRequestDTO
  const { password, securityQuestion, securityAnswer, isArchived, ...cleanData } = data;
  return await api.put(`/admin/users/${id}`, cleanData);
};

// API call to reset a user's password (flag for forced change)
const resetPassword = async (id: string) => {
  return await api.put(`/auth/admin/reset-password/${id}`);
};

const fetchUserSummary = async (): Promise<UserSummary> => {
  const { data } = await api.get("/admin/users/summary");
  return data;
};

export { fetchUsers, fetchUser, archiveUser, registerUser, updateUser, resetPassword, fetchUserSummary };