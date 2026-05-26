import { QueryClient, queryOptions } from '@tanstack/react-query';
import { fetchUsers, fetchUser, archiveUser, restoreUser, registerUser, updateUser, fetchUserSummary } from '@/features/users/services/userApi';
import { toast } from "sonner";  
import type { NavigateFunction } from 'react-router-dom';   
import type { UserFormData } from '@/features/users/types';  

function createUsersListQueryOptions(page: number, size: number, keyword?: string, sortBy?: string, sortOrder?: string, role?: string, sex?: string, archivedStatus?: string) {
  return queryOptions({
    queryKey: ["users", page, size, keyword ?? "", sortBy ?? "fullNameSortable", sortOrder ?? "asc", role ?? "", sex ?? "", archivedStatus ?? "ACTIVE"],
    queryFn: () => fetchUsers(page, size, keyword, sortBy, sortOrder, role, sex, archivedStatus),
  });
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
          const message = error?.response?.data?.message || error?.response?.data || "Failed to create user. Please try again.";
          toast.error("Error", {
            description: typeof message === "string" ? message : "Failed to create user. Please try again.",
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
      queryClient.invalidateQueries({ queryKey: ["user-summary"] });
      toast.success("User Archived");
    },
    onError: () => {
      toast.error("Failed to archive user.");
    },
  }
}

function createRestoreUserMutationOptions(queryClient: QueryClient) {
    return {
    mutationFn: restoreUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-summary"] });
      toast.success("User Restored");
    },
    onError: () => {
      toast.error("Failed to restore user.");
    },
  }
}

function createUserSummaryQueryOptions() {
  return queryOptions({
    queryKey: ["user-summary"],
    queryFn: fetchUserSummary,
    staleTime: 30_000,
  });
}

export { createUsersListQueryOptions, createEditUserQueryOptions, createArchiveUserMutationOptions, createRestoreUserMutationOptions, createAddUserMutationOptions, createEditUserMutationOptions, createUserSummaryQueryOptions };