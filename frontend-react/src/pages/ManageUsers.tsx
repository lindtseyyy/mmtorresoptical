// src/pages/ManageUsers.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Archive, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  createArchiveUserMutationOptions,
} from "@/query/userQuery";
import { fetchUsers } from "@/api/userApi";

const getCurrentUserId = (): string | null => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId ?? null;
  } catch {
    return null;
  }
};

const PAGE_SIZE = 10;

const ManageUsers: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  const { data: pageData, isLoading, isFetching } = useQuery({
    queryKey: ["users", page, PAGE_SIZE],
    queryFn: () => fetchUsers(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const users = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  const archiveMutation = useMutation(
    createArchiveUserMutationOptions(queryClient)
  );

  const filteredUsers = users.filter(
    (user) =>
      (
        user.firstName.toLowerCase() +
        " " +
        user.lastName.toLowerCase()
      ).includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (users.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [users.length, page, isFetching]);

  const activeUsers = filteredUsers
    .filter((u) => !u.isArchived)
    .sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return 0;
    });

  const stats = {
    total: totalElements,
    admins: activeUsers.filter((u) => u.role === "Admin").length,
    staff: activeUsers.filter((u) => u.role === "Staff").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage system users and their access permissions.
          </p>
        </div>
        <Button onClick={() => navigate("/users/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Administrators</p>
            <p className="text-3xl font-bold">{stats.admins}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Staff Members</p>
            <p className="text-3xl font-bold">{stats.staff}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  System Users ({totalElements})
                </p>
                {activeUsers.length === 0 && !isLoading && (
                  <p className="text-center text-muted-foreground py-8">
                    No users found.
                  </p>
                )}
                {activeUsers.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        {user.userId === currentUserId && (
                          <Badge className="bg-violet-600">You</Badge>
                        )}
                        <Badge
                          variant={
                            user.role === "Admin" ? "default" : "secondary"
                          }
                          className="capitalize"
                        >
                          {user.role}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-green-600 text-green-600"
                        >
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{user.username} | {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Joined: {new Date(user.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    </div>
                    {user.userId !== currentUserId && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/users/edit/${user.userId}`)}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => archiveMutation.mutate(user.userId)}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive className="mr-1 h-4 w-4" />
                          Archive
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p - 1)}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageUsers;
