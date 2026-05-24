import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Calendar, FileText, Activity, Stethoscope, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, MoreHorizontal, Pencil, Archive, Clock, Plus, Undo2, Ban, Copy, CheckCircle, UserX, XCircle, Eye } from "lucide-react";
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
import {
  fetchPatient,
  fetchPatientProfileMetrics,
  fetchPatientPrescriptions,
  fetchPatientEyeExams,
  type PrescriptionListItem,
  type EyeExamListItem,
} from "@/features/patients/services/patientApi";
import { voidPrescription, fetchPrescription } from "@/features/patients/services/prescriptionApi";
import { getEyeExam, voidEyeExam } from "@/features/patients/services/eyeExamApi";
import { fetchFollowUpsByPatient, updateFollowUpStatus, createFollowUp, updateFollowUp, archiveFollowUp, restoreFollowUp, type PatientFollowUp, type CreateFollowUpInput } from "@/features/patients/services/followUpApi";

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

const formatEyeExamDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
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
  const [expandedSections, setExpandedSections] = useState({ lens: false, products: false });
  const { data: viewRxData, isLoading: viewRxLoading } = useQuery({
    queryKey: ["prescription", viewRxId],
    queryFn: () => fetchPrescription(viewRxId!),
    enabled: !!viewRxId,
  });

  const [voidEeDialog, setVoidEeDialog] = useState<EyeExamListItem | null>(null);
  const [voidEeReason, setVoidEeReason] = useState("");
  const [voidingEe, setVoidingEe] = useState(false);

  const [viewEeId, setViewEeId] = useState<string | null>(null);
  const { data: viewEeData, isLoading: viewEeLoading } = useQuery({
    queryKey: ["eye-exam", viewEeId],
    queryFn: () => getEyeExam(viewEeId!),
    enabled: !!viewEeId,
  });

  const [fuFilter, setFuFilter] = useState("ALL");
  const [fuStatusFilter, setFuStatusFilter] = useState("PENDING");
  const [fuPage, setFuPage] = useState(0);
  const { data: followUps, isLoading: followUpsLoading } = useQuery({
    queryKey: ["patient-follow-ups", patientId, fuFilter, fuStatusFilter, fuPage],
    queryFn: () => fetchFollowUpsByPatient(
      patientId,
      fuStatusFilter === "ALL" ? undefined : fuStatusFilter,
      fuFilter,
      fuPage,
      5,
    ),
    placeholderData: keepPreviousData,
    enabled: !!patientId,
  });

  const [fuModal, setFuModal] = useState<{ open: boolean; edit: PatientFollowUp | null }>({ open: false, edit: null });
  const [fuForm, setFuForm] = useState({ scheduledDate: "", followUpReason: "", prescriptionId: "", eyeExamId: "" });

  const updateFollowUpMutation = useMutation({
    mutationFn: ({ followUpId, status }: { followUpId: string; status: string }) =>
      updateFollowUpStatus(followUpId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
      const label = variables.status === "NO_SHOW" ? "No Show" : variables.status.charAt(0) + variables.status.slice(1).toLowerCase();
      toast.success(`Follow-up marked as ${label}`);
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
              <p className="font-medium">{patient?.sex || "—"}</p>
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
            {patient?.medicalHistory && (
              <div className="col-span-2 sm:col-span-3 pt-2 pt-2 border-t border-muted-foreground/30">
                <p className="text-xs text-muted-foreground">Medical History</p>
                <p className="text-sm whitespace-pre-wrap">{patient.medicalHistory}</p>
              </div>
            )}
          </div>
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
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="VOIDED">Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" asChild>
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
              No{eeFilter === "VOIDED" ? " voided" : ""} eye exams recorded.
            </p>
          ) : (
            <div className="space-y-3">
              {eeData.content.map((ee: EyeExamListItem) => (
                <div
                  key={ee.eyeExamId}
                  className={`rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted${ee.status === "VOIDED" ? " opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {ee.examNumber}
                        </span>
                        {ee.examType && (
                          <Badge className={ee.examType === "COMPUTERIZED" ? "bg-blue-700 text-white" : "bg-gray-700 text-white"}>
                            {ee.examType === "COMPUTERIZED" ? "Computerized" : "Manual"}
                          </Badge>
                        )}
                        {ee.status === "VOIDED" && (
                          <Badge className="bg-red-800 text-white">Voided</Badge>
                        )}
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
                        Performed {formatEyeExamDateTime(ee.createdAt)}
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
                        <DropdownMenuItem onClick={() => setViewEeId(ee.eyeExamId)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {ee.status !== "VOIDED" && (
                          <DropdownMenuItem
                            onClick={() => setVoidEeDialog(ee)}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Void
                          </DropdownMenuItem>
                        )}
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
                  <SelectTrigger className="w-[130px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="VOIDED">Voided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" asChild>
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
                          {rx.rxNumber}
                        </span>
                        {rx.isArchived && (
                          <Badge variant="secondary" className="bg-gray-500 text-white">Archived</Badge>
                        )}
                        {rx.status === "VOIDED" && (
                          <Badge className="ml-2 bg-red-800 text-white">Voided</Badge>
                        )}
                      </div>
                      {rx.notes && (
                        <p className="text-sm text-muted-foreground">{rx.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Date Issued: {formatDate(rx.issueDate)}
                        {rx.eyeExamId ? " · Internal Rx" : " · Outside Rx"}
                        {rx.createdBy ? ` — by ${rx.createdBy.fullName}` : ""}
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
                        {!rx.isArchived && rx.status !== "VOIDED" && (
                          <DropdownMenuItem
                            onClick={() => setVoidRxDialog(rx)}
                            className="text-red-600"
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Void {rx.rxNumber}
                          </DropdownMenuItem>
                        )}
                        {rx.status === "VOIDED" && (
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/patients/add/prescription?patientId=${patientId}&patientName=${encodeURIComponent(fullName)}&cloneFrom=${rx.prescriptionId}`}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Clone & Re-issue
                            </Link>
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
                <span className="text-sm text-muted-foreground whitespace-nowrap">Follow Up Status:</span>
                <Select value={fuStatusFilter} onValueChange={(v) => { setFuStatusFilter(v); setFuPage(0); }}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="NO_SHOW">No Show</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground whitespace-nowrap">Status:</span>
                <Select value={fuFilter} onValueChange={(v) => { setFuFilter(v); setFuPage(0); }}>
                  <SelectTrigger className="w-[110px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="VOIDED">Archived</SelectItem>
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
          ) : !followUps || followUps.content.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {fuFilter === "VOIDED" ? "No archived follow-ups." : "No follow-ups scheduled."}
            </p>
          ) : (
            <div className="space-y-3">
              {followUps.content.map((fu: PatientFollowUp) => (
                <div
                  key={fu.followUpId}
                  className={`rounded-lg border p-4 transition-colors bg-muted/60 hover:bg-muted${fu.isArchived ? " opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Badge className={
                        fu.status === "COMPLETED" ? "bg-green-700 text-white hover:bg-green-700 w-[90px] justify-center shrink-0" :
                        fu.status === "CANCELLED" ? "bg-red-600 text-white hover:bg-red-600 w-[90px] justify-center shrink-0" :
                        fu.status === "NO_SHOW" ? "bg-gray-600 text-white hover:bg-gray-600 w-[90px] justify-center shrink-0" :
                        "bg-amber-600 text-white hover:bg-amber-600 w-[90px] justify-center shrink-0"
                      }>
                        {fu.status === "NO_SHOW" ? "No Show" : fu.status.charAt(0) + fu.status.slice(1).toLowerCase()}
                      </Badge>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatDate(fu.scheduledDate)}
                          </span>
                          {fu.isArchived && (
                            <Badge className="bg-gray-600 text-white">Archived</Badge>
                          )}
                        </div>
                        {fu.followUpReason ? (
                          <p className="text-sm text-muted-foreground">{fu.followUpReason}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No reason provided.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {fu.isArchived ? (
                        <Button
                          size="sm"
                          className="bg-green-800 text-white hover:bg-green-900"
                          onClick={() => restoreFuMutation.mutate(fu.followUpId)}
                          disabled={restoreFuMutation.isPending}
                        >
                          <Undo2 className="mr-1 h-4 w-4" />
                          Restore
                        </Button>
                      ) : fu.status === "PENDING" ? (
                        <Button
                          size="sm"
                          className="bg-green-700 text-white hover:bg-green-800"
                          onClick={() => updateFollowUpMutation.mutate({ followUpId: fu.followUpId, status: "COMPLETED" })}
                          disabled={updateFollowUpMutation.isPending}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Complete
                        </Button>
                      ) : (fu.status === "NO_SHOW" || fu.status === "CANCELLED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditFuModal(fu)}
                        >
                          <Calendar className="mr-1 h-4 w-4" />
                          Reschedule
                        </Button>
                      )}
                      {fu.status !== "COMPLETED" && !fu.isArchived && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-12 w-12 shrink-0 hover:bg-muted p-0 [&_svg]:size-auto focus-visible:ring-0">
                              <MoreHorizontal className="h-10 w-10" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                            {fu.status === "PENDING" ? (
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
                                <DropdownMenuItem
                                  onClick={() => archiveFuMutation.mutate(fu.followUpId)}
                                  disabled={archiveFuMutation.isPending}
                                >
                                  <Archive className="mr-2 h-4 w-4" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => archiveFuMutation.mutate(fu.followUpId)}
                                disabled={archiveFuMutation.isPending}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {followUps.totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Page {fuPage + 1} of {followUps.totalPages}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFuPage((p) => p - 1)}
                      disabled={fuPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFuPage((p) => p + 1)}
                      disabled={fuPage >= followUps.totalPages - 1}
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

      {/* Void Eye Exam Confirmation Dialog */}
      <Dialog open={voidEeDialog !== null} onOpenChange={(open) => { if (!open) { setVoidEeDialog(null); setVoidEeReason(""); } }}>
        <DialogHeader>
          <DialogTitle>Void Eye Exam</DialogTitle>
          <DialogDescription>
            Are you sure you want to void {voidEeDialog ? voidEeDialog.examNumber : ""}? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for voiding</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
              placeholder="Enter reason (at least 10 characters)..."
              rows={3}
              value={voidEeReason}
              onChange={(e) => setVoidEeReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setVoidEeDialog(null); setVoidEeReason(""); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-800 hover:bg-red-900 text-white"
              disabled={voidEeReason.length < 10 || voidingEe}
              onClick={async () => {
                if (!voidEeDialog) return;
                setVoidingEe(true);
                try {
                  await voidEyeExam(voidEeDialog.eyeExamId, voidEeReason);
                  toast.success("Eye exam voided successfully");
                  setVoidEeDialog(null);
                  setVoidEeReason("");
                  queryClient.invalidateQueries({ queryKey: ["patient-eye-exams"] });
                } catch (err: any) {
                  toast.error(err?.response?.data || "Failed to void eye exam");
                } finally {
                  setVoidingEe(false);
                }
              }}
            >
              {voidingEe ? "Voiding..." : "Confirm Void"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* View Eye Exam Dialog */}
      <Dialog open={viewEeId !== null} onOpenChange={(open) => { if (!open) setViewEeId(null); }}>
        {viewEeLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !viewEeData ? (
          <div className="py-16 text-center text-muted-foreground">Failed to load eye exam.</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Eye Exam Details — {viewEeData.examNumber}</DialogTitle>
              <DialogDescription>
                Performed {formatEyeExamDateTime(viewEeData.createdAt)}
                {viewEeData.performedBy ? ` by ${viewEeData.performedBy.fullName}` : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewEeData.status === "VOIDED" && (
                <Badge className="bg-red-800 text-white">Voided</Badge>
              )}
              {viewEeData.examType && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Exam Type</p>
                  <Badge className={viewEeData.examType === "COMPUTERIZED" ? "bg-blue-700 text-white" : "bg-gray-700 text-white"}>
                    {viewEeData.examType === "COMPUTERIZED" ? "Computerized" : "Manual"}
                  </Badge>
                </div>
              )}
              {viewEeData.chiefComplaint && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Chief Complaint</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.chiefComplaint}</p>
                </div>
              )}
              {viewEeData.medicalHistorySnapshot && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Medical History Snapshot</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.medicalHistorySnapshot}</p>
                </div>
              )}
              {viewEeData.clinicalImpression && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Clinical Impression</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.clinicalImpression}</p>
                </div>
              )}
              {viewEeData.planNotes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Plan Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.planNotes}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {viewEeData.vaUnconvertedOd && <div><p className="text-xs font-medium text-muted-foreground">VA Unconverted (OD)</p><p className="text-sm">{viewEeData.vaUnconvertedOd}</p></div>}
                {viewEeData.vaUnconvertedOs && <div><p className="text-xs font-medium text-muted-foreground">VA Unconverted (OS)</p><p className="text-sm">{viewEeData.vaUnconvertedOs}</p></div>}
                {viewEeData.vaAidedOd && <div><p className="text-xs font-medium text-muted-foreground">VA Aided (OD)</p><p className="text-sm">{viewEeData.vaAidedOd}</p></div>}
                {viewEeData.vaAidedOs && <div><p className="text-xs font-medium text-muted-foreground">VA Aided (OS)</p><p className="text-sm">{viewEeData.vaAidedOs}</p></div>}
                {viewEeData.iopOd && <div><p className="text-xs font-medium text-muted-foreground">IOP (OD)</p><p className="text-sm">{viewEeData.iopOd}</p></div>}
                {viewEeData.iopOs && <div><p className="text-xs font-medium text-muted-foreground">IOP (OS)</p><p className="text-sm">{viewEeData.iopOs}</p></div>}
              </div>
              {viewEeData.slitLampExamination && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Slit Lamp Examination</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.slitLampExamination}</p>
                </div>
              )}
              {viewEeData.fundusExamination && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Fundus Examination</p>
                  <p className="text-sm whitespace-pre-wrap">{viewEeData.fundusExamination}</p>
                </div>
              )}
              {viewEeData.status === "VOIDED" && viewEeData.voidReason && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Void Reason</p>
                  <p className="text-sm">{viewEeData.voidReason}</p>
                </div>
              )}
              {viewEeData.voidedAt && (
                <p className="text-xs text-muted-foreground">
                  Voided {formatDateTime(viewEeData.voidedAt)}
                  {viewEeData.voidedBy ? ` by ${viewEeData.voidedBy.fullName}` : ""}
                </p>
              )}
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={() => setViewEeId(null)}>
                Close
              </Button>
            </div>
          </>
        )}
      </Dialog>

      {/* Void Prescription Confirmation Dialog */}
      <Dialog open={voidRxDialog !== null} onOpenChange={(open) => { if (!open) { setVoidRxDialog(null); setVoidReason(""); } }}>
        <DialogHeader>
          <DialogTitle>Void Prescription</DialogTitle>
          <DialogDescription>
            Are you sure you want to void{" "}
            <strong>{voidRxDialog ? voidRxDialog.rxNumber : "this prescription"}</strong>{" "}
            from{" "}
            <strong>{voidRxDialog ? formatDate(voidRxDialog.issueDate) : ""}</strong>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Reason for voiding</label>
            <textarea
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
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
              className="bg-red-800 hover:bg-red-900 text-white"
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
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
              value={fuForm.scheduledDate}
              onChange={(e) => setFuForm((f) => ({ ...f, scheduledDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Follow-up Reason</label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
              placeholder="e.g. Routine check-up, monitor progress..."
              rows={3}
              value={fuForm.followUpReason}
              onChange={(e) => setFuForm((f) => ({ ...f, followUpReason: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Link to Prescription (Optional)</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
              value={fuForm.prescriptionId}
              onChange={(e) => setFuForm((f) => ({ ...f, prescriptionId: e.target.value }))}
            >
              <option value="">None</option>
              {rxData?.content.map((rx: PrescriptionListItem) => (
                <option key={rx.prescriptionId} value={rx.prescriptionId}>
                  {formatDate(rx.issueDate)} {rx.notes ? `— ${rx.notes.substring(0, 40)}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Link to Eye Exam (Optional)</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
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
            <div className="-mx-6 -mt-6 px-6 pt-6 pb-4 bg-slate-100 border-b space-y-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Prescription Details — {viewRxData.rxNumber}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Date Issued: {formatDate(viewRxData.issueDate)}
                  {viewRxData.eyeExamNumber && (
                    <><br />Linked Exam: {viewRxData.eyeExamNumber}</>
                  )}
                </p>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2">
                {viewRxData.status === "VOIDED" ? (
                  <Badge className="bg-red-800 text-white">Voided</Badge>
                ) : (
                  <Badge className={viewRxData.isArchived ? "bg-gray-500 text-white" : "bg-green-700 text-white"}>
                    {viewRxData.isArchived ? "Archived" : "Active"}
                  </Badge>
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
            </div>

            <div className="space-y-4">
              {/* Prescription Items */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-semibold mb-2 hover:text-primary transition-colors w-full text-left cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, lens: !prev.lens }))}
                >
                  {expandedSections.lens ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  Eyeglass Specifications ({viewRxData.lensSpecifications?.length ?? 0})
                </button>
                {expandedSections.lens && (
                  (!viewRxData.lensSpecifications || viewRxData.lensSpecifications.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No lens specifications.</p>
                  ) : (
                    <div className="space-y-3">
                      {viewRxData.lensSpecifications.map((lens, li) => (
                        <div key={li} className="rounded-lg border p-3 bg-muted/40">
                          {lens.lensTypePurpose && (
                            <h5 className="text-sm font-semibold text-primary mb-1">{lens.lensTypePurpose}</h5>
                          )}
                          {lens.correctionType && (
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {lens.correctionType.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          )}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Right Eye (OD)</p>
                              <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                                <span className="text-muted-foreground">SPH</span>
                                <span className="text-muted-foreground">CYL</span>
                                <span className="text-muted-foreground">Axis</span>
                                <span className="font-mono">{lens.rightSph != null ? lens.rightSph : "—"}</span>
                                <span className="font-mono">{lens.rightCyl != null ? lens.rightCyl : "—"}</span>
                                <span className="font-mono">{lens.rightAxis != null ? lens.rightAxis : "—"}</span>
                                <span className="text-muted-foreground">Prism</span>
                                <span className="text-muted-foreground">Add</span>
                                <span className="text-muted-foreground">PD</span>
                                <span className="font-mono">{lens.rightPrism != null ? lens.rightPrism : "—"}</span>
                                <span className="font-mono">{lens.rightAdd != null ? lens.rightAdd : "—"}</span>
                                <span className="font-mono">{lens.rightPd != null ? lens.rightPd : "—"}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">Left Eye (OS)</p>
                              <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                                <span className="text-muted-foreground">SPH</span>
                                <span className="text-muted-foreground">CYL</span>
                                <span className="text-muted-foreground">Axis</span>
                                <span className="font-mono">{lens.leftSph != null ? lens.leftSph : "—"}</span>
                                <span className="font-mono">{lens.leftCyl != null ? lens.leftCyl : "—"}</span>
                                <span className="font-mono">{lens.leftAxis != null ? lens.leftAxis : "—"}</span>
                                <span className="text-muted-foreground">Prism</span>
                                <span className="text-muted-foreground">Add</span>
                                <span className="text-muted-foreground">PD</span>
                                <span className="font-mono">{lens.leftPrism != null ? lens.leftPrism : "—"}</span>
                                <span className="font-mono">{lens.leftAdd != null ? lens.leftAdd : "—"}</span>
                                <span className="font-mono">{lens.leftPd != null ? lens.leftPd : "—"}</span>
                              </div>
                            </div>
                          </div>
                          {(lens.lensType || lens.frameTypePreference || lens.lensMaterial || lens.lensCoatings || lens.lensWearType || lens.lensMaterialCl || lens.baseCurve != null || lens.diameter != null) && (
                            <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                              {lens.lensType && <div><span className="text-muted-foreground">Lens:</span> {lens.lensType.replace(/_/g, " ")}</div>}
                              {lens.frameTypePreference && <div><span className="text-muted-foreground">Frame:</span> {lens.frameTypePreference}</div>}
                              {lens.lensMaterial && <div><span className="text-muted-foreground">Material:</span> {lens.lensMaterial}</div>}
                              {lens.lensCoatings && <div><span className="text-muted-foreground">Coatings:</span> {lens.lensCoatings}</div>}
                              {lens.lensWearType && <div><span className="text-muted-foreground">Wear:</span> {lens.lensWearType}</div>}
                              {lens.lensMaterialCl && <div><span className="text-muted-foreground">CL Material:</span> {lens.lensMaterialCl}</div>}
                              {lens.baseCurve != null && <div><span className="text-muted-foreground">BC:</span> {lens.baseCurve}</div>}
                              {lens.diameter != null && <div><span className="text-muted-foreground">DIA:</span> {lens.diameter}</div>}
                            </div>
                          )}
                          {lens.notes && (
                            <p className="text-xs text-muted-foreground mt-2">Notes: {lens.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Product Recommendations */}
              <div>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-semibold mb-2 hover:text-primary transition-colors w-full text-left cursor-pointer"
                  onClick={() => setExpandedSections(prev => ({ ...prev, products: !prev.products }))}
                >
                  {expandedSections.products ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  Medication / Products ({viewRxData.recommendations?.length ?? 0})
                </button>
                {expandedSections.products && (
                  (!viewRxData.recommendations || viewRxData.recommendations.length === 0) ? (
                    <p className="text-sm text-muted-foreground">No medications or products.</p>
                  ) : (
                    <div className="space-y-2">
                      {viewRxData.recommendations.map((rec) => (
                        <div key={rec.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="text-sm font-medium">{rec.productName}</p>
                            <p className="text-xs text-muted-foreground">{rec.category}</p>
                            {rec.staffNotes && (
                              <p className="text-xs text-muted-foreground mt-1 italic">&ldquo;{rec.staffNotes}&rdquo;</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">₱{rec.unitPrice.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Qty: {rec.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default ViewPatient;
