import type {User, UserFormData} from "@/types";
import api from "@/lib/axiosInstance";

// API call to fetch all users
const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get("/users" );
  return data;
};

// API call to get one user
const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get(`/users/${id}`);
  return data;
};

// API call to archive a user   
const archiveUser = async (id: string) => {
  return await api.delete(`/users/${id}`);
};

// API call to register a new user
const registerUser = async (data: UserFormData) => {
  return await api.post("/api/users", data);
};

// API call to update a user
const updateUser = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<UserFormData>;
}) => {
  // Don't send an empty password
  if (data.password === "") {
    delete data.password;
  }
  
  return await api.put(`/users/${id}`, data);
};

export { fetchUsers, fetchUser, archiveUser, registerUser, updateUser }; 