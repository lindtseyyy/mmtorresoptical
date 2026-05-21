import type { PageResponse } from "@/shared/types";
import type { User, UserFormData, UserSummary } from "@/features/users/types";
import api from "@/shared/lib/axiosInstance";

const ROLE_TO_BACKEND: Record<string, string> = {
  Admin: "ADMIN",
  Staff: "STAFF",
};

const ROLE_FROM_BACKEND: Record<string, string> = {
  ADMIN: "Admin",
  STAFF: "Staff",
};

const mapEnumsToBackend = (data: { sex?: string; role?: string }) => {
  if (data.sex) {
    data.sex = data.sex.toUpperCase();
  }
  if (data.role && ROLE_TO_BACKEND[data.role]) {
    data.role = ROLE_TO_BACKEND[data.role];
  }
};

const mapUserFromBackend = (user: User): User => ({
  ...user,
  sex: user.sex.charAt(0) + user.sex.slice(1).toLowerCase(),
  role: (ROLE_FROM_BACKEND[user.role] ?? user.role) as User["role"],
});

// API call to fetch users (backend returns Page<UserDetailsDTO>)
const fetchUsers = async (
  page = 0,
  size = 10,
  keyword?: string,
  sortBy = "fullNameSortable",
  sortOrder = "asc",
  role?: string,
  sex?: string,
  archivedStatus = "ACTIVE",
): Promise<PageResponse<User>> => {
  const { data } = await api.get("/admin/users", {
    params: {
      page,
      size,
      sortBy,
      sortOrder,
      archivedStatus,
      ...(keyword && { keyword }),
      ...(role && role !== "all" && { role }),
      ...(sex && sex !== "all" && { sex }),
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

// API call to restore a user
const restoreUser = async (id: string) => {
  return await api.put(`/admin/users/${id}/restore`);
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

// API call to reset a user's password (set temporary password and force change)
const resetPassword = async (id: string, temporaryPassword: string) => {
  return await api.put(`/auth/admin/reset-password/${id}`, { temporaryPassword });
};

const fetchUserSummary = async (): Promise<UserSummary> => {
  const { data } = await api.get("/admin/users/summary");
  return data;
};

export { fetchUsers, fetchUser, archiveUser, restoreUser, registerUser, updateUser, resetPassword, fetchUserSummary };