import { useState, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Plus, Search, Eye, ChevronLeft, ChevronRight, Users, UserCheck, ArchiveIcon, Shield, UserCog, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/components/ui/card";
import type { User } from "@/features/users/types";
import {
  createUsersListQueryOptions,
  createUserSummaryQueryOptions,
} from "@/features/users/hooks/userQuery";

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("fullNameSortable");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [roleFilter, setRoleFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navigate = useNavigate();
  const currentUserId = getCurrentUserId();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createUsersListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, sortBy, sortOrder, roleFilter, genderFilter),
    placeholderData: keepPreviousData,
  });

  const users = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  // Reset page when search or sort changes
  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, sortBy, sortOrder, roleFilter, genderFilter]);

  // If current page is empty and not the first page, step back
  useEffect(() => {
    if (users.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [users.length, page, isFetching]);

  // Keep current user pinned to top; otherwise preserve server sort order
  const sortedUsers = [...users].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  const { data: summary } = useQuery(createUserSummaryQueryOptions());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Registration</h2>
          <p className="text-muted-foreground">
            Manage system users and their access permissions.
          </p>
        </div>
        <Button onClick={() => navigate("/users/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.totalUsers ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.activeUsers ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Active Users</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ArchiveIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.archivedUsers ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Archived Users</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{summary?.adminUsers ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Administrators</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-300">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-500/10">
              <UserCog className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.staffUsers ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Staff Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, username, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sort By:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fullNameSortable">Name</SelectItem>
                    <SelectItem value="createdAt">Created At</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Role:</span>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Gender:</span>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHERS">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[22%] py-3 pr-4 font-medium">Full Name</th>
                      <th className="w-[14%] py-3 pr-4 font-medium">Username</th>
                      <th className="w-[24%] py-3 pr-4 font-medium">Email</th>
                      <th className="w-[8%] py-3 pr-4 text-center font-medium">Role</th>
                      <th className="w-[16%] py-3 pr-4 font-medium">Contact Number</th>
                      <th className="w-[8%] py-3 pr-4 font-medium">Gender</th>
                      <th className="w-[8%] py-3 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => (
                      <tr
                        key={user.userId}
                        className={`border-b transition-colors hover:bg-muted ${user.userId === currentUserId ? "bg-muted" : ""}`}
                      >
                        <td className="py-3 pr-4">
                          <span className="block truncate font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">@{user.username}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{user.email}</span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge
                            className={
                              user.role === "Admin"
                                ? "bg-blue-700 hover:bg-blue-700 text-white"
                                : "bg-gray-600 hover:bg-gray-600 text-white"
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{user.contactNumber}</span>
                        </td>
                        <td className="py-3 pr-4 capitalize">
                          <span className="block truncate">{user.gender}</span>
                        </td>
                        <td className="py-3">
                          {user.userId !== currentUserId ? (
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/users/view/${user.userId}`)}
                              >
                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <Badge className="bg-violet-600 text-white hover:bg-violet-600">You</Badge>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {sortedUsers.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No users found.
                </p>
              )}

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
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default ManageUsers;
