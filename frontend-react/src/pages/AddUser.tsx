import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserForm } from "@/components/forms/UserForm";
import type { UserFormData } from "@/types";
import axios from "axios";
import { toast } from "sonner";

// API call to register a new user
const registerUser = async (data: UserFormData) => {
  const token = localStorage.getItem("authToken");
  return await axios.post("http://localhost:8080/api/users", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User Created", {
        description: "The new user account has been successfully created.",
      });
      navigate("/users");
    },
    onError: (error) => {
      toast.error("Error", {
        description: "Failed to create user. Please try again.",
      });
      console.error(error);
    },
  });

  const handleFormSubmit = async (data: UserFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Add New User</h2>
        <p className="text-muted-foreground">
          Create a new system user account
        </p>
      </div>
      <UserForm
        onFormSubmit={handleFormSubmit}
        isLoading={mutation.isPending}
        isEditMode={false}
      />
    </div>
  );
};

export default AddUser;
