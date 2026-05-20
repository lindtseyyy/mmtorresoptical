import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Calendar, FileText, Activity, Stethoscope, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Archive, Clock, Plus, Undo2, Ban, Copy, CheckCircle, UserX, XCircle, Eye } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Badge } from "@/shared/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import { restorePatient } from "@/features/patients/services/patientApi";
import {
  fetchPatient,
  fetchPatientProfileMetrics,
  fetchPatientPrescriptions,
  fetchPatientEyeExams,
  type PatientProfileMetrics,
  type PrescriptionListItem,
  type EyeExamListItem,
} from "@/features/patients/services/patientApi";
import { createArchivePatientMutationOptions } from "@/features/patients/hooks/patientQuery";
import { voidPrescription, clonePrescription, fetchPrescription, type PrescriptionResponse } from "@/features/patients/services/prescriptionApi";
import { fetchFollowUpsByPatient, updateFollowUpStatus, createFollowUp, updateFollowUp, archiveFollowUp, restoreFollowUp, type PatientFollowUp, type CreateFollowUpInput } from "@/features/patients/services/followUpApi";
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

  const [eePage, setEePage] = useState(0);
  const [eeFilter, setEeFilter] = useState("ACTIVE");
  const { data: eeData } = useQuery({
    queryKey: ["patient-eye-exams", patientId, eePage, eeFilter],
    queryFn: () => fetchPatientEyeExams(patientId, eePage, 5, eeFilter),
    placeholderData: keepPreviousData,
    enabled: !!patientId,
  });

  const [voidRxDialog, setVoidRxDialog] = useState<PrescriptionListItem | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const [viewRxId, setViewRxId] = useState<string | null>(null);
  const { data: viewRxData, isLoading: viewRxLoading } = useQuery({
    queryKey: ["prescription", viewRxId],
    queryFn: () => fetchPrescription(viewRxId!),
    enabled: !!viewRxId,
  });

  const archiveRxMutation = useMutation({
    mutationFn: (rxId: string) => api.delete(`/admin/prescriptions/${rxId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions", patientId] });
      toast.success("Prescription archived");
    },
    onError: () => toast.error("Failed to archive prescription"),
  });

  const archiveEeMutation = useMutation({
    mutationFn: (eeId: string) => api.delete(`/admin/eye-exams/${eeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-eye-exams", patientId] });
      toast.success("Eye exam archived");
    },
    onError: () => toast.error("Failed to archive eye exam"),
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

  const [fuFilter, setFuFilter] = useState("ACTIVE");
  const [fuStatusFilter, setFuStatusFilter] = useState("PENDING");
  const { data: followUps, isLoading: followUpsLoading } = useQuery({
    queryKey: ["patient-follow-ups", patientId, fuFilter, fuStatusFilter],
    queryFn: () => fetchFollowUpsByPatient(
      patientId,
      fuStatusFilter !== "ALL" ? fuStatusFilter : undefined,
      fuFilter === "ARCHIVED"
    ),
    enabled: !!patientId,
  });

  const [fuModal, setFuModal] = useState<{ open: boolean; edit: PatientFollowUp | null }>({ open: false, edit: null });
  const [fuForm, setFuForm] = useState({ scheduledDate: "", followUpReason: "", prescriptionId: "", eyeExamId: "" });

  const updateFollowUpMutation = useMutation({
    mutationFn: ({ followUpId, status }: { followUpId: string; status: string }) =>
      updateFollowUpStatus(followUpId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
    },
    onError: (err: any) => toast.error(err?.response?.data || "Failed to update follow-up"),
  });

  const saveFuMutation = useMutation({
    mutationFn: (data: CreateFollowUpInput) =>
      fuModal.edit
        ? updateFollowUp(fuModal.edit.followUpId, { scheduledDate: data.scheduledDate, followUpReason: data.followUpReason })
        : createFollowUp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
      toast.success(fuModal.edit ? "Follow-up updated" : "Follow-up created");
      setFuModal({ open: false, edit: null });
    },
    onError: (err: any) => toast.error(err?.response?.data || "Failed to save follow-up"),
  });

  const archiveFuMutation = useMutation({
    mutationFn: (fuId: string) => archiveFollowUp(fuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
      toast.success("Follow-up archived");
    },
    onError: () => toast.error("Failed to archive follow-up"),
  });

  const restoreFuMutation = useMutation({
    mutationFn: (fuId: string) => restoreFollowUp(fuId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
      toast.success("Follow-up restored");
    },
    onError: () => toast.error("Failed to restore follow-up"),
  });

  const openCreateFuModal = () => {
    setFuForm({ scheduledDate: "", followUpReason: "", prescriptionId: "", eyeExamId: "" });
    setFuModal({ open: true, edit: null });
  };

  const openEditFuModal = (fu: PatientFollowUp) => {
    setFuForm({
      scheduledDate: fu.scheduledDate,
      followUpReason: fu.followUpReason || "",
      prescriptionId: fu.prescriptionId || "",
      eyeExamId: fu.eyeExamId || "",
    });
    setFuModal({ open: true, edit: fu });
  };

  const handleClone = async (prescriptionId: string) => {
    try {
      await clonePrescription(prescriptionId);
      toast.success("Prescription cloned successfully");
      queryClient.invalidateQueries({ queryKey: ["patient-prescriptions"] });
    } catch (err: any) {
      toast.error(err?.response?.data || "Failed to clone prescription");
    }
  };

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
        <MetricCard
          icon={Calendar}
          label="Total Visits"
          value={metrics?.totalVisits ?? "—"}
          color="primary"
          size="sm"
        />
        <MetricCard
          icon={Activity}
          label="Last Visit"
          value={formatDate(metrics?.lastVisitDate ?? null)}
          color="blue"
          size="sm"
        />
        <MetricCard
          icon={Stethoscope}
          label="Last Prescription"
          value={formatDate(metrics?.lastPrescriptionDate ?? null)}
          color="amber"
          size="sm"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Products Purchased"
          value={metrics?.purchasedProducts ?? "—"}
          color="emerald"
          size="sm"
        />
        <MetricCard
          icon={FileText}
          label="Total Purchased"
          value={metrics != null
            ? `₱ ${metrics.totalAmountPurchased.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : "—"}
          color="violet"
          size="sm"
        />
        <MetricCard
          icon={Clock}
          label="Patient Since"
          value={formatDate(patient?.createdAt ?? null)}
          color="rose"
          size="sm"
        />
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Patient profile information</CardDescription>
            </div>
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              size="sm"
              onClick={() => navigate(`/patients/edit/${patientId}`)}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit Patient
            </Button>
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

      {/* Follow-Ups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-Ups
              </CardTitle>
              <CardDescription>
                Scheduled follow-up visits
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={fuStatusFilter} onValueChange={(v) => setFuStatusFilter(v)}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Select value={fuFilter} onValueChange={(v) => setFuFilter(v)}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" onClick={openCreateFuModal}>
                <Plus className="mr-1 h-4 w-4" />
                Add Follow-Up
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {followUpsLoading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Loading follow-ups...</p>
          ) : !followUps || followUps.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {fuFilter === "ARCHIVED" ? "No archived follow-ups." : "No follow-ups scheduled."}
            </p>
          ) : (
            <div className="space-y-3">
              {followUps.map((fu: PatientFollowUp) => (
                <div
                  key={fu.followUpId}
                  className={`rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted${fu.isArchived ? " opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatDate(fu.scheduledDate)}
                        </span>
                        <Badge className={
                          fu.status === "COMPLETED" ? "bg-green-700 text-white hover:bg-green-700" :
                          fu.status === "CANCELLED" ? "bg-red-600 text-white hover:bg-red-600" :
                          fu.status === "NO_SHOW" ? "bg-gray-600 text-white hover:bg-gray-600" :
                          "bg-amber-600 text-white hover:bg-amber-600"
                        }>
                          {fu.status === "NO_SHOW" ? "No Show" : fu.status.charAt(0) + fu.status.slice(1).toLowerCase()}
                        </Badge>
                        {fu.isArchived && (
                          <Badge className="bg-gray-600 text-white">Archived</Badge>
                        )}
                      </div>
                      {fu.followUpReason && (
                        <p className="text-sm text-muted-foreground">{fu.followUpReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {!fu.isArchived && fu.status !== "COMPLETED" && fu.status !== "CANCELLED" && (
                        <Button
                          size="sm"
                          className="bg-green-700 text-white hover:bg-green-800"
                          onClick={() => updateFollowUpMutation.mutate({ followUpId: fu.followUpId, status: "COMPLETED" })}
                          disabled={updateFollowUpMutation.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Complete
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                          {fu.isArchived ? (
                            <DropdownMenuItem
                              onClick={() => restoreFuMutation.mutate(fu.followUpId)}
                              disabled={restoreFuMutation.isPending}
                            >
                              <Undo2 className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <>
                              {fu.status !== "COMPLETED" && fu.status !== "CANCELLED" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => updateFollowUpMutation.mutate({ followUpId: fu.followUpId, status: "NO_SHOW" })}
                                    disabled={updateFollowUpMutation.isPending}
                                  >
                                    <UserX className="mr-2 h-4 w-4" />
                                    Mark No Show
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => updateFollowUpMutation.mutate({ followUpId: fu.followUpId, status: "CANCELLED" })}
                                    disabled={updateFollowUpMutation.isPending}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Mark Cancelled
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openEditFuModal(fu)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => archiveFuMutation.mutate(fu.followUpId)}
                                disabled={archiveFuMutation.isPending}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  className={`rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted${rx.status === "VOIDED" ? " opacity-60" : ""}`}
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
                        {rx.status === "VOIDED" && (
                          <Badge variant="destructive" className="ml-2">VOIDED</Badge>
                        )}
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
                        <DropdownMenuItem onClick={() => setViewRxId(rx.prescriptionId)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {!rx.isArchived && (
                          <DropdownMenuItem
                            onClick={() => setVoidRxDialog(rx)}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Void
                          </DropdownMenuItem>
                        )}
                        {rx.status === "VOIDED" && (
                          <DropdownMenuItem onClick={() => handleClone(rx.prescriptionId)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Clone & Re-issue
                          </DropdownMenuItem>
                        )}
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

      {/* Eye Exams */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Eye Exams
              </CardTitle>
              <CardDescription>
                {eeData?.totalElements ?? 0} total exam(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select value={eeFilter} onValueChange={(v) => { setEeFilter(v); setEePage(0); }}>
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
                <Link to={`/patients/add/eye-exam?patientId=${patientId}&patientName=${encodeURIComponent(fullName)}`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Eye Exam
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!eeData || eeData.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No eye exams recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {eeData.content.map((ee: EyeExamListItem) => (
                <div
                  key={ee.eyeExamId}
                  className="rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Exam: {formatDateTime(ee.createdAt)}
                        </span>
                        <Badge
                          variant="secondary"
                          className={ee.isArchived ? "bg-gray-500 text-white" : "bg-green-100 text-green-700"}
                        >
                          {ee.isArchived ? "Archived" : "Active"}
                        </Badge>
                      </div>

                      {ee.chiefComplaint && (
                        <div>
                          <p className="text-xs text-muted-foreground">Chief Complaint</p>
                          <p className="text-sm">{ee.chiefComplaint}</p>
                        </div>
                      )}
                      {ee.clinicalImpression && (
                        <div>
                          <p className="text-xs text-muted-foreground">Clinical Impression</p>
                          <p className="text-sm">{ee.clinicalImpression}</p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Performed {formatDateTime(ee.createdAt)}
                        {ee.performedBy ? ` by ${ee.performedBy.fullName}` : ""}
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
                          onClick={() => archiveEeMutation.mutate(ee.eyeExamId)}
                          disabled={archiveEeMutation.isPending || ee.isArchived}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {eeData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {eePage + 1} of {eeData.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEePage((p) => p - 1)}
                      disabled={eePage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEePage((p) => p + 1)}
                      disabled={eePage >= eeData.totalPages - 1}
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

      {/* Void Prescription Confirmation Dialog */}
      <Dialog open={voidRxDialog !== null} onOpenChange={(open) => { if (!open) { setVoidRxDialog(null); setVoidReason(""); } }}>
        <DialogHeader>
          <DialogTitle>Void Prescription</DialogTitle>
          <DialogDescription>
            Are you sure you want to void the prescription from {voidRxDialog ? formatDate(voidRxDialog.examDate) : ""}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for voiding</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
              placeholder="Enter reason (at least 10 characters)..."
              rows={3}
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setVoidRxDialog(null); setVoidReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={voidReason.length < 10 || voiding}
              onClick={async () => {
                if (!voidRxDialog) return;
                setVoiding(true);
                try {
                  await voidPrescription(voidRxDialog.prescriptionId, voidReason);
                  toast.success("Prescription voided successfully");
                  setVoidRxDialog(null);
                  setVoidReason("");
                  queryClient.invalidateQueries({ queryKey: ["patient-prescriptions"] });
                } catch (err: any) {
                  toast.error(err?.response?.data || "Failed to void prescription");
                } finally {
                  setVoiding(false);
                }
              }}
            >
              {voiding ? "Voiding..." : "Confirm Void"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Follow-Up Management Modal */}
      <Dialog open={fuModal.open} onOpenChange={(open) => { if (!open) setFuModal({ open: false, edit: null }); }}>
        <DialogHeader>
          <DialogTitle>{fuModal.edit ? "Edit Follow-Up" : "Add Follow-Up"}</DialogTitle>
          <DialogDescription>
            {fuModal.edit ? "Modify the follow-up details" : "Schedule a new follow-up visit"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target Date *</label>
            <input
              type="date"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
              value={fuForm.scheduledDate}
              onChange={(e) => setFuForm((f) => ({ ...f, scheduledDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Follow-up Reason</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
              placeholder="e.g. Routine check-up, monitor progress..."
              rows={3}
              value={fuForm.followUpReason}
              onChange={(e) => setFuForm((f) => ({ ...f, followUpReason: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Link to Prescription (Optional)</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
              value={fuForm.prescriptionId}
              onChange={(e) => setFuForm((f) => ({ ...f, prescriptionId: e.target.value }))}
            >
              <option value="">None</option>
              {rxData?.content.map((rx: PrescriptionListItem) => (
                <option key={rx.prescriptionId} value={rx.prescriptionId}>
                  {formatDate(rx.examDate)} {rx.notes ? `— ${rx.notes.substring(0, 40)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Link to Eye Exam (Optional)</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-1"
              value={fuForm.eyeExamId}
              onChange={(e) => setFuForm((f) => ({ ...f, eyeExamId: e.target.value }))}
            >
              <option value="">None</option>
              {eeData?.content.map((ee: EyeExamListItem) => (
                <option key={ee.eyeExamId} value={ee.eyeExamId}>
                  {formatDateTime(ee.createdAt)} {ee.chiefComplaint ? `— ${ee.chiefComplaint.substring(0, 40)}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setFuModal({ open: false, edit: null })}>
            Cancel
          </Button>
          <Button
            disabled={!fuForm.scheduledDate || saveFuMutation.isPending}
            onClick={() => {
              saveFuMutation.mutate({
                patientId,
                scheduledDate: fuForm.scheduledDate,
                followUpReason: fuForm.followUpReason || undefined,
                prescriptionId: fuForm.prescriptionId || undefined,
                eyeExamId: fuForm.eyeExamId || undefined,
              });
            }}
          >
            {saveFuMutation.isPending ? "Saving..." : fuModal.edit ? "Save Changes" : "Create Follow-Up"}
          </Button>
        </div>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={viewRxId !== null} onOpenChange={(open) => { if (!open) setViewRxId(null); }}>
        {viewRxLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !viewRxData ? (
          <div className="py-16 text-center text-muted-foreground">Failed to load prescription.</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Prescription Details</DialogTitle>
              <DialogDescription>
                Exam Date: {formatDate(viewRxData.examDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Status badges */}
              <div className="flex items-center gap-2">
                <Badge className={viewRxData.isArchived ? "bg-gray-500 text-white" : "bg-green-100 text-green-700"}>
                  {viewRxData.isArchived ? "Archived" : "Active"}
                </Badge>
                {viewRxData.status === "VOIDED" && (
                  <Badge variant="destructive">VOIDED</Badge>
                )}
              </div>

              {/* Notes */}
              {viewRxData.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{viewRxData.notes}</p>
                </div>
              )}

              {/* Meta */}
              <div>
                <p className="text-xs text-muted-foreground">
                  Created {formatDateTime(viewRxData.createdAt)}
                  {viewRxData.createdBy ? ` by ${viewRxData.createdBy.fullName}` : ""}
                </p>
              </div>

              {/* Prescription Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">
                  Prescription Items ({viewRxData.prescriptionItems.length})
                </h4>
                {viewRxData.prescriptionItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items.</p>
                ) : (
                  <div className="space-y-3">
                    {viewRxData.prescriptionItems.map((item, idx) => (
                      <div key={item.prescriptionItemId} className="rounded-lg border p-3 bg-muted/40">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">Item {idx + 1}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.correctionType.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {item.eyeSide}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                          {item.sph != null && <div><span className="text-muted-foreground">SPH:</span> {item.sph}</div>}
                          {item.cyl != null && <div><span className="text-muted-foreground">CYL:</span> {item.cyl}</div>}
                          {item.axis != null && <div><span className="text-muted-foreground">Axis:</span> {item.axis}</div>}
                          {item.addPower != null && <div><span className="text-muted-foreground">Add:</span> {item.addPower}</div>}
                          {item.pd != null && <div><span className="text-muted-foreground">PD:</span> {item.pd}</div>}
                          {item.lensType && <div><span className="text-muted-foreground">Lens:</span> {item.lensType.replace(/_/g, " ")}</div>}
                          {item.frameTypePreference && <div className="col-span-2"><span className="text-muted-foreground">Frame:</span> {item.frameTypePreference}</div>}
                          {item.lensMaterial && <div><span className="text-muted-foreground">Material:</span> {item.lensMaterial}</div>}
                          {item.lensCoatings && <div><span className="text-muted-foreground">Coatings:</span> {item.lensCoatings}</div>}
                          {item.lensWearType && <div><span className="text-muted-foreground">Wear:</span> {item.lensWearType}</div>}
                          {item.lensMaterialCl && <div><span className="text-muted-foreground">CL Material:</span> {item.lensMaterialCl}</div>}
                          {item.baseCurve != null && <div><span className="text-muted-foreground">Base Curve:</span> {item.baseCurve}</div>}
                          {item.diameter != null && <div><span className="text-muted-foreground">Diameter:</span> {item.diameter}</div>}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-2">Notes: {item.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewRxId(null)}>
                Close
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ViewPatient;
