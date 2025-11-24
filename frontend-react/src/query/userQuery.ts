import { QueryClient, queryOptions } from '@tanstack/react-query'; 
import { fetchUsers, fetchUser, archiveUser, registerUser, updateUser } from '../api/userApi';
import { toast } from "sonner";  
import type { NavigateFunction } from 'react-router-dom';   
import type { UserFormData } from '@/types';  

function createUsersListQueryOptions() {
  return queryOptions(  {
    queryKey: ["users"],
    queryFn: fetchUsers,
  })
}

function createEditUserQueryOptions(id: string) {
  return queryOptions(  {
    queryKey: ["user", id],
    queryFn: () => fetchUser(id!),
    enabled: !!id,
  })
}

function createAddUserMutationOptions(queryClient: QueryClient, navigate: NavigateFunction) {
    return {
        mutationFn: registerUser,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["users"] });
          toast.success("User Created", {
            description: "The new user account has been successfully created.",
          });
          navigate("/users");
        },
        onError: (error: any) => {
          toast.error("Error", {
            description: "Failed to create user. Please try again.",
          });
          console.error(error);
        },
      }

}

function createEditUserMutationOptions(queryClient: QueryClient, navigate: NavigateFunction, id: string) {
    return {
    mutationFn: (data: UserFormData) => updateUser({ id: id!, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user", id] });
      toast.success("User Updated", {
        description: "The user account has been successfully updated.",
      });
      navigate("/users");
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: "Failed to update user. Please try again.",
      });
      console.error(error);
    },
  }
}

function createArchiveUserMutationOptions(queryClient: QueryClient) {
    return {
    mutationFn: archiveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User Archived");
    },
    onError: () => {
      toast.error("Failed to archive user.");
    },
  }
}

export { createUsersListQueryOptions, createEditUserQueryOptions, createArchiveUserMutationOptions, createAddUserMutationOptions, createEditUserMutationOptions };