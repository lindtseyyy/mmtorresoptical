import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Calendar, FileText, Activity, ClipboardList, Stethoscope, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Archive, Clock, Plus, Undo2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
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
import { toast } from "sonner";
import { restorePatient } from "@/features/patients/services/patientApi";
import {
  fetchPatient,
  fetchPatientProfileMetrics,
  fetchPatientPrescriptions,
  fetchPatientHealthHistories,
  type PatientProfileMetrics,
  type PrescriptionListItem,
  type HealthHistoryItem,
} from "@/features/patients/services/patientApi";
import { createArchivePatientMutationOptions } from "@/features/patients/hooks/patientQuery";
import api from "@/shared/lib/axiosInstance";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ViewPatient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = id!;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => fetchPatient(patientId),
    enabled: !!patientId,
  });

  const { data: metrics } = useQuery({
    queryKey: ["patient-profile-metrics", patientId],
    queryFn: () => fetchPatientProfileMetrics(patientId),
    enabled: !!patientId,
  });

  const [rxPage, setRxPage] = useState(0);
  const [rxFilter, setRxFilter] = useState("ACTIVE");
  const { data: rxData } = useQuery({
    queryKey: ["patient-prescriptions", patientId, rxPage, rxFilter],
    queryFn: () => fetchPatientPrescriptions(patientId, rxPage, 5, rxFilter),
    placeholderData: keepPreviousData,
    enabled: !!patientId,
  });

  const [hhPage, setHhPage] = useState(0);
  const [hhFilter, setHhFilter] = useState("ACTIVE");
  const { data: hhData } = useQuery({
    queryKey: ["patient-health-histories", patientId, hhPage, hhFilter],
    queryFn: () => fetchPatientHealthHistories(patientId, hhPage, 5, hhFilter),
    placeholderData: keepPreviousData,
    enabled: !!patientId,
  });

  const archiveRxMutation = useMutation({
    mutationFn: (rxId: string) => api.delete(`/admin/prescriptions/${rxId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patientId] });
      toast.success("Prescription archived");
    },
    onError: () => toast.error("Failed to archive prescription"),
  });

  const archiveHhMutation = useMutation({
    mutationFn: (hhId: string) => api.delete(`/admin/health-histories/${hhId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-health-histories", patientId] });
      toast.success("Health history archived");
    },
    onError: () => toast.error("Failed to archive health history"),
  });

  const archivePatientMutation = useMutation(
    createArchivePatientMutationOptions(queryClient)
  );

  const restorePatientMutation = useMutation({
    mutationFn: restorePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-metrics"] });
      toast.success("Patient Restored", {
        description: "The patient has been successfully restored.",
      });
    },
    onError: () => {
      toast.error("Error", { description: "Failed to restore patient." });
    },
  });

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const fullName = patient
    ? [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold">{fullName}</h2>
            <Badge
              className={
                patient?.isArchived
                  ? "bg-gray-600 text-white"
                  : "bg-green-700 text-white hover:bg-green-700 cursor-default"
              }
            >
              {patient?.isArchived ? "Archived" : "Active"}
            </Badge>
          </div>
          <p className="text-muted-foreground">Patient profile and records</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/patients">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
      </div>

      {/* Card Metrics — 2 rows × 3 cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{metrics?.totalVisits ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{formatDate(metrics?.lastVisitDate ?? null)}</p>
              <p className="text-xs text-muted-foreground">Last Visit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
              <Stethoscope className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{formatDate(metrics?.lastPrescriptionDate ?? null)}</p>
              <p className="text-xs text-muted-foreground">Last Prescription</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10">
              <ShoppingCart className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">{metrics?.purchasedProducts ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Products Purchased</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/10">
              <FileText className="h-4 w-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold">
                {metrics != null
                  ? `₱ ${metrics.totalAmountPurchased.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Total Purchased</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-500/10">
              <Clock className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold">{formatDate(patient?.createdAt ?? null)}</p>
              <p className="text-xs text-muted-foreground">Patient Since</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Patient profile information</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 shrink-0 p-0 [&_svg]:size-auto focus-visible:ring-0">
                  <MoreHorizontal className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/patients/edit/${patientId}`)
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    patient?.isArchived
                      ? restorePatientMutation.mutate(patientId)
                      : archivePatientMutation.mutate(patientId)
                  }
                  disabled={archivePatientMutation.isPending || restorePatientMutation.isPending}
                >
                  {patient?.isArchived ? (
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">First Name</p>
              <p className="font-medium">{patient?.firstName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Middle Name</p>
              <p className="font-medium">{patient?.middleName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Name</p>
              <p className="font-medium">{patient?.lastName || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-medium">{patient?.gender || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Birth Date</p>
              <p className="font-medium">{formatDate(patient?.birthDate ?? null)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium truncate">{patient?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact Number</p>
              <p className="font-medium">{patient?.contactNumber || "—"}</p>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium">{patient?.address || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Prescriptions
              </CardTitle>
              <CardDescription>
                {rxData?.totalElements ?? 0} total prescription(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={rxFilter} onValueChange={(v) => { setRxFilter(v); setRxPage(0); }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button asChild>
                <Link to={`/patients/add/prescription?patientId=${patientId}&patientName=${encodeURIComponent(fullName)}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Prescription
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!rxData || rxData.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No prescriptions recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {rxData.content.map((rx: PrescriptionListItem) => (
                <div
                  key={rx.prescriptionId}
                  className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Exam: {formatDate(rx.examDate)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={rx.isArchived ? "bg-gray-500 text-white" : "bg-green-100 text-green-700"}
                        >
                          {rx.isArchived ? "Archived" : "Active"}
                        </Badge>
                      </div>
                      {rx.notes && (
                        <p className="text-sm text-muted-foreground">{rx.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {formatDateTime(rx.createdAt)}
                        {rx.createdBy ? ` by ${rx.createdBy.fullName}` : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-12 w-12 shrink-0 hover:bg-muted p-0 [&_svg]:size-auto focus-visible:ring-0">
                          <MoreHorizontal className="h-10 w-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/patients/edit/prescription?prescriptionId=${rx.prescriptionId}&patientId=${patientId}&patientName=${encodeURIComponent(fullName)}`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => archiveRxMutation.mutate(rx.prescriptionId)}
                          disabled={archiveRxMutation.isPending || rx.isArchived}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {rxData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {rxPage + 1} of {rxData.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRxPage((p) => p - 1)}
                      disabled={rxPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRxPage((p) => p + 1)}
                      disabled={rxPage >= rxData.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Histories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Medical History
              </CardTitle>
              <CardDescription>
                {hhData?.totalElements ?? 0} total record(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={hhFilter} onValueChange={(v) => { setHhFilter(v); setHhPage(0); }}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" asChild>
                <Link to={`/patients/add/health-history?patientId=${patientId}&patientName=${encodeURIComponent(fullName)}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Medical History
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hhData || hhData.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No medical history recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {hhData.content.map((hh: HealthHistoryItem) => (
                <div
                  key={hh.historyId}
                  className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Exam: {formatDate(hh.examDate)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={hh.isArchived ? "bg-gray-500 text-white" : "bg-green-100 text-green-700"}
                        >
                          {hh.isArchived ? "Archived" : "Active"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {hh.eyeConditions && (
                          <div>
                            <p className="text-xs text-muted-foreground">Eye Conditions</p>
                            <p className="text-sm">{hh.eyeConditions}</p>
                          </div>
                        )}
                        {hh.systemicConditions && (
                          <div>
                            <p className="text-xs text-muted-foreground">Systemic Conditions</p>
                            <p className="text-sm">{hh.systemicConditions}</p>
                          </div>
                        )}
                        {hh.medications && (
                          <div>
                            <p className="text-xs text-muted-foreground">Medications</p>
                            <p className="text-sm">{hh.medications}</p>
                          </div>
                        )}
                        {hh.allergies && (
                          <div>
                            <p className="text-xs text-muted-foreground">Allergies</p>
                            <p className="text-sm">{hh.allergies}</p>
                          </div>
                        )}
                        {hh.visualAcuityRight && (
                          <div>
                            <p className="text-xs text-muted-foreground">Visual Acuity (Right)</p>
                            <p className="text-sm">{hh.visualAcuityRight}</p>
                          </div>
                        )}
                        {hh.visualAcuityLeft && (
                          <div>
                            <p className="text-xs text-muted-foreground">Visual Acuity (Left)</p>
                            <p className="text-sm">{hh.visualAcuityLeft}</p>
                          </div>
                        )}
                      </div>

                      {hh.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm">{hh.notes}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Recorded {formatDateTime(hh.createdAt)}
                        {hh.createdBy ? ` by ${hh.createdBy.fullName}` : ""}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-12 w-12 shrink-0 hover:bg-muted p-0 [&_svg]:size-auto focus-visible:ring-0">
                          <MoreHorizontal className="h-10 w-10" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Edit health history", { description: "Feature coming soon." })
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => archiveHhMutation.mutate(hh.historyId)}
                          disabled={archiveHhMutation.isPending || hh.isArchived}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {hhData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {hhPage + 1} of {hhData.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHhPage((p) => p - 1)}
                      disabled={hhPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHhPage((p) => p + 1)}
                      disabled={hhPage >= hhData.totalPages - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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

export default ViewPatient;
