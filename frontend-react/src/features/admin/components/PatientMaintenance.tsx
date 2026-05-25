import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Search, Archive, Undo2, ChevronLeft, ChevronRight, ArchiveIcon, ShoppingCart, ClockAlert, ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Card, CardContent } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
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
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import type { Patient } from "@/features/patients/types";
import { restorePatient } from "@/features/patients/services/patientApi";
import {
  createArchivePatientMutationOptions,
  createPatientsListQueryOptions,
  createMaintenanceMetricsQueryOptions,
} from "@/features/patients/hooks/patientQuery";

const PAGE_SIZE = 10;

const PatientMaintenance: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState("fullNameSortable");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [archivedFilter, setArchivedFilter] = useState("ACTIVE");
  const [sexFilter, setSexFilter] = useState("all");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryClient = useQueryClient();

  const { data: pageData, isLoading, isFetching } = useQuery({
    ...createPatientsListQueryOptions(page, PAGE_SIZE, debouncedSearchQuery, sortBy, sortOrder, archivedFilter, sexFilter),
    placeholderData: keepPreviousData,
  });

  const patients = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const { data: m } = useQuery(createMaintenanceMetricsQueryOptions());

  const [pendingArchive, setPendingArchive] = useState<{ id: string; unarchive: boolean } | null>(null);

  const archiveMutation = useMutation(
    createArchivePatientMutationOptions(queryClient)
  );

  const restoreMutation = useMutation({
    mutationFn: restorePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["patient-maintenance-metrics"] });
    },
    onError: () => {},
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
  }, [debouncedSearchQuery, sortBy, sortOrder, archivedFilter, sexFilter]);

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
      <div>
        <h2 className="text-3xl font-bold">Patient Maintenance</h2>
        <p className="text-muted-foreground">
          Archive and restore patient records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard icon={ArchiveIcon} label="Archived Patients" value={m?.archivedPatients ?? 0} color="muted" />
        <MetricCard icon={ShoppingCart} label="Patients Without Purchases" value={m?.patientsWithoutPurchases ?? 0} color="orange" />
        <MetricCard icon={ClockAlert} label="Stale Pending Follow-Ups" value={m?.stalePendingFollowUps ?? 0} color="rose" />
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sex:</span>
                <Select value={sexFilter} onValueChange={setSexFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex min-h-[570px] items-center justify-center">
              <p className="text-center text-muted-foreground">
                No patients found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[26%] py-3 pr-4 font-medium">Full Name</th>
                      <th className="w-[24%] py-3 pr-4 font-medium">Email</th>
                      <th className="w-[10%] py-3 pr-4 text-left font-medium">Gender</th>
                      <th className="w-[14%] py-3 pr-4 text-left font-medium">Contact Number</th>
                      <th className="w-[10%] py-3 pr-4 text-left font-medium">Birth Date</th>
                      <th className="w-[8%] py-3 pr-4 text-center font-medium">Status</th>
                      <th className="w-[8%] py-3 pr-4 text-center font-medium">Action</th>
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
                        <td className="py-3 pr-4 text-left capitalize">
                          <span className="block truncate">{patient.sex}</span>
                        </td>
                        <td className="py-3 pr-4 text-left text-muted-foreground">
                          <span className="block truncate">{patient.contactNumber}</span>
                        </td>
                        <td className="py-3 pr-4 text-left text-muted-foreground">
                          {formatDate(patient.birthDate)}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge
                            variant={patient.isArchived ? "outline" : "default"}
                            className={
                              patient.isArchived
                                ? "border-amber-500 text-amber-600"
                                : "bg-emerald-600 hover:bg-emerald-600 text-white"
                            }
                          >
                            {patient.isArchived ? "Archived" : "Active"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex justify-center">
                          <Button
                            variant={patient.isArchived ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleArchive(patient.patientId, patient.isArchived)}
                            disabled={archiveMutation.isPending || restoreMutation.isPending}
                            className={
                              patient.isArchived
                                ? "bg-green-700 hover:bg-green-800 text-white"
                                : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                            }
                          >
                            {patient.isArchived ? (
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
                          </div>
                        </td>
                      </tr>
                    ))}
                    <EmptyTableRows
                      count={PAGE_SIZE - (patients?.length ?? 0)}
                      colSpan={7}
                      className="h-[57px]"
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

export default PatientMaintenance;
