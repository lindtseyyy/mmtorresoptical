import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Plus, Search, Archive, Eye, ChevronLeft, ChevronRight, MoreHorizontal, Users, UserCheck, ArchiveIcon, ArrowUp, ArrowDown, Undo2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
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
import type { Patient } from "@/features/patients/types";
import { restorePatient } from "@/features/patients/services/patientApi";
import {
  createArchivePatientMutationOptions,
  createPatientsListQueryOptions,
  createPatientMetricsQueryOptions,
} from "@/features/patients/hooks/patientQuery";

const PAGE_SIZE = 10;

const ManagePatients: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("fullNameSortable");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [archivedFilter, setArchivedFilter] = useState("ACTIVE");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createPatientsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, sortBy, sortOrder, archivedFilter, genderFilter),
    placeholderData: keepPreviousData,
  });

  const patients = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;

  // Stable counts — unaffected by filter changes
  const { data: metrics } = useQuery(createPatientMetricsQueryOptions());
  const totalPatients = metrics?.totalPatients ?? 0;
  const activePatients = (metrics?.totalPatients ?? 0) - (metrics?.archivedPatients ?? 0);
  const archivedPatients = metrics?.archivedPatients ?? 0;

  const [pendingArchive, setPendingArchive] = useState<{ id: string; unarchive: boolean } | null>(null);

  const archiveMutation = useMutation(
    createArchivePatientMutationOptions(queryClient)
  );

  const restoreMutation = useMutation({
    mutationFn: restorePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      toast.success("Patient Restored", {
        description: "The patient has been successfully restored.",
      });
    },
    onError: () => {
      toast.error("Error", { description: "Failed to restore patient." });
    },
  });

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
  }, [debouncedSearchQuery, sortBy, sortOrder, archivedFilter, genderFilter]);

  useEffect(() => {
    if (patients.length === 0 && page > 0 && !isFetching) {
      setPage((p) => Math.max(0, p - 1));
    }
  }, [patients.length, page, isFetching]);

  const fullName = (p: Patient) =>
    [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Patient Management</h2>
          <p className="text-muted-foreground">
            Manage patient records and information.
          </p>
        </div>
        <Button onClick={() => navigate("/patients/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPatients}</p>
              <p className="text-sm text-muted-foreground">Total Patients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activePatients}</p>
              <p className="text-sm text-muted-foreground">Active Patients</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ArchiveIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{archivedPatients}</p>
              <p className="text-sm text-muted-foreground">Archived Patients</p>
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
                  placeholder="Search by name or email..."
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
                      <th className="w-[26%] py-3 pr-4 font-medium">Full Name</th>
                      <th className="w-[26%] py-3 pr-4 font-medium">Email</th>
                      <th className="w-[10%] py-3 pr-4 text-center font-medium">Gender</th>
                      <th className="w-[16%] py-3 pr-4 font-medium">Contact Number</th>
                      <th className="w-[12%] py-3 pr-4 text-center font-medium">Birth Date</th>
                      <th className="w-[10%] py-3 pr-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient) => (
                      <tr
                        key={patient.patientId}
                        className="border-b transition-colors hover:bg-muted"
                      >
                        <td className="py-3 pr-4">
                          <span className="block truncate font-medium">
                            {fullName(patient)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{patient.email}</span>
                        </td>
                        <td className="py-3 pr-4 text-center capitalize">
                          <span className="block truncate">{patient.gender}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{patient.contactNumber}</span>
                        </td>
                        <td className="py-3 pr-4 text-center text-muted-foreground">
                          {formatDate(patient.birthDate)}
                        </td>
                        <td className="py-3 pl-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-10 w-10 shrink-0 p-0 [&_svg]:size-auto focus-visible:ring-0">
                                <MoreHorizontal className="h-8 w-8" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/patients/view/${patient.patientId}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleArchive(patient.patientId, patient.isArchived)}
                                disabled={archiveMutation.isPending || restoreMutation.isPending}
                              >
                                {patient.isArchived ? (
                                  <>
                                    <Undo2 className="mr-2 h-4 w-4" />
                                    Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive className="mr-2 h-4 w-4" />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {patients.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No patients found.
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

      <AlertDialog open={!!pendingArchive} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingArchive?.unarchive ? "Restore Patient" : "Archive Patient"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingArchive?.unarchive
                ? "Are you sure you want to restore "
                : "Are you sure you want to archive "}
              <span className="font-semibold text-foreground">
                {(() => {
                  const found = patients.find((p) => p.patientId === pendingArchive?.id);
                  return found ? fullName(found) : "";
                })()}
              </span>
              {pendingArchive?.unarchive
                ? "? This will make the patient active again."
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

export default ManagePatients;
