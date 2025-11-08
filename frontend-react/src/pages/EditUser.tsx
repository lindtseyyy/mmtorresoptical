import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserForm } from "@/components/forms/UserForm";
import type { UserFormData, User } from "@/types";
import axios from "axios";
import { toast } from "sonner";

// API call to get one user
const fetchUser = async (id: string): Promise<User> => {
  const token = localStorage.getItem("authToken");
  const { data } = await axios.get(`http://localhost:8080/api/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
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
  const token = localStorage.getItem("authToken");
  return await axios.put(`http://localhost:8080/api/users/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const EditUser: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingData } = useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => updateUser({ id: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      toast.success("User Updated", {
        description: "The user account has been successfully updated.",
      });
      navigate("/users");
    },
    onError: (error) => {
      toast.error("Error", {
        description: "Failed to update user. Please try again.",
      });
      console.error(error);
    },
  });

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Edit User</h2>
        <p className="text-muted-foreground">
          Update user details and permissions
        </p>
      </div>
      <UserForm
        onFormSubmit={mutation.mutateAsync}
        isLoading={mutation.isPending}
        isEditMode={true}
        defaultValues={user}
      />
    </div>
  );
};

export default EditUser;
