import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Search, Archive, Undo2, ChevronLeft, ChevronRight, Users, UserCheck, ArchiveIcon, ArrowUp, ArrowDown } from "lucide-react";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  createArchiveUserMutationOptions,
  createRestoreUserMutationOptions,
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

const UserMaintenance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("fullNameSortable");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [archivedFilter, setArchivedFilter] = useState("ACTIVE");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createUsersListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, sortBy, sortOrder, undefined, undefined, archivedFilter),
    placeholderData: keepPreviousData,
  });

  const users = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const [pendingArchive, setPendingArchive] = useState<{ id: string; unarchive: boolean } | null>(null);

  const archiveMutation = useMutation(
    createArchiveUserMutationOptions(queryClient)
  );

  const restoreMutation = useMutation(
    createRestoreUserMutationOptions(queryClient)
  );

  const handleArchive = (id: string, unarchive: boolean) => {
    setPendingArchive({ id, unarchive });
  };

  const confirmArchive = () => {
    if (pendingArchive) {
      if (pendingArchive.unarchive) {
        restoreMutation.mutate(pendingArchive.id);
      } else {
        archiveMutation.mutate(pendingArchive.id);
      }
      setPendingArchive(null);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [debouncedSearchQuery, sortBy, sortOrder, archivedFilter]);

  useEffect(() => {
    if (users.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [users.length, page, isFetching]);

  const sortedUsers = [...users].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return 0;
  });

  const { data: summary } = useQuery(createUserSummaryQueryOptions());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">User Maintenance</h2>
        <p className="text-muted-foreground">
          Archive and restore user accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={archivedFilter} onValueChange={setArchivedFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                    <SelectItem value="ALL">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="flex min-h-[550px] items-center justify-center">
              <p className="text-center text-muted-foreground">
                No users found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[22%] py-3 pl-4 pr-4 font-medium">Full Name</th>
                      <th className="w-[14%] py-3 pr-4 font-medium">Username</th>
                      <th className="w-[24%] py-3 pr-4 font-medium">Email</th>
                      <th className="w-[10%] py-3 pr-4 text-center font-medium">Role</th>
                      <th className="w-[10%] py-3 pr-4 text-center font-medium">Status</th>
                      <th className="w-[20%] py-3 pl-4 text-center font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user, index) => (
                      <tr
                        key={user.userId}
                        className={`border-b transition-colors hover:bg-muted/30 ${user.userId === currentUserId ? "bg-muted" : index % 2 !== 0 ? "bg-transparent" : "bg-muted"}`}
                      >
                        <td className="py-3 pl-4 pr-4">
                          <span className="block truncate font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-muted-foreground">
                          <span className="block truncate">@{user.username}</span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-muted-foreground">
                          <span className="block truncate">{user.email}</span>
                        </td>
                        <td className="py-3 pl-4 pr-4 text-center">
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
                        <td className="py-3 pl-4 pr-4 text-center">
                          <Badge
                            variant={user.isArchived ? "outline" : "default"}
                            className={
                              user.isArchived
                                ? "border-amber-500 text-amber-600"
                                : "bg-emerald-600 hover:bg-emerald-600 text-white"
                            }
                          >
                            {user.isArchived ? "Archived" : "Active"}
                          </Badge>
                        </td>
                        <td className="py-3 pl-4 text-center">
                          {user.userId === currentUserId ? (
                            <Badge className="bg-violet-600 text-white hover:bg-violet-600">You</Badge>
                          ) : (
                            <Button
                              variant={user.isArchived ? "default" : "outline"}
                              size="sm"
                              onClick={() => handleArchive(user.userId, user.isArchived)}
                              disabled={archiveMutation.isPending || restoreMutation.isPending}
                              className={
                                user.isArchived
                                  ? "bg-green-700 hover:bg-green-800 text-white"
                                  : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                              }
                            >
                              {user.isArchived ? (
                                <>
                                  <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                                  Restore
                                </>
                              ) : (
                                <>
                                  <Archive className="mr-1.5 h-3.5 w-3.5" />
                                  Archive
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    <EmptyTableRows
                      count={PAGE_SIZE - (sortedUsers?.length ?? 0)}
                      colSpan={6}
                      className="h-[55px]"
                    />
                  </tbody>
                </table>
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
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingArchive} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingArchive?.unarchive ? "Restore User" : "Archive User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingArchive?.unarchive
                ? "Are you sure you want to restore "
                : "Are you sure you want to archive "}
              <span className="font-semibold text-foreground">
                {users.find((u) => u.userId === pendingArchive?.id)?.firstName}{" "}
                {users.find((u) => u.userId === pendingArchive?.id)?.lastName}
              </span>
              {pendingArchive?.unarchive
                ? "? This will make the user active again."
                : "? This action can be reversed later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              className={pendingArchive?.unarchive
                ? "bg-green-700 text-white hover:bg-green-800"
                : "bg-red-700 text-white hover:bg-red-800"
              }
            >
              {pendingArchive?.unarchive ? "Restore" : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserMaintenance;
