import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart, Calendar, FileText, Activity, Stethoscope, Clock, Pencil, Footprints } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { MetricCard } from "@/shared/components/MetricCard";
import { Badge } from "@/shared/components/ui/badge";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchPatient,
  fetchPatientProfileMetrics,
} from "@/features/patients/services/patientApi";
import { fetchFollowUpsByPatient, type PatientFollowUp } from "@/features/patients/services/followUpApi";
import { logVisit, type LogVisitInput } from "@/features/patients/services/visitApi";
import EyeExamsPanel from "./EyeExamsPanel";
import PrescriptionsPanel from "./PrescriptionsPanel";
import FollowUpsPanel from "./FollowUpsPanel";
import VisitTimelinePanel from "./VisitTimelinePanel";

export const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
};

export const formatEyeExamDateTime = (dateStr: string | null) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${date} • ${time}`;
};

const tabOptions = [
  { value: "exams", label: "Eye Exams" },
  { value: "prescriptions", label: "Prescriptions" },
  { value: "followups", label: "Follow-Ups" },
  { value: "timeline", label: "Visit Timeline" },
];

const ViewPatient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const patientId = id!;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("exams");

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

  const getCurrentLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentLocalTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [logVisitOpen, setLogVisitOpen] = useState(false);
  const [logVisitDate, setLogVisitDate] = useState(getCurrentLocalDate());
  const [logVisitTime, setLogVisitTime] = useState(getCurrentLocalTime());
  const [logVisitPurpose, setLogVisitPurpose] = useState("");
  const [logVisitNotes, setLogVisitNotes] = useState("");
  const [logVisitFollowUp, setLogVisitFollowUp] = useState("");

  const resetLogVisitForm = () => {
    setLogVisitDate(getCurrentLocalDate());
    setLogVisitTime(getCurrentLocalTime());
    setLogVisitPurpose("");
    setLogVisitNotes("");
    setLogVisitFollowUp("");
  };

  const { data: pendingFollowUps } = useQuery({
    queryKey: ["patient-pending-follow-ups", patientId],
    queryFn: () => fetchFollowUpsByPatient(patientId, "PENDING", "ACTIVE", 0, 100),
    enabled: logVisitOpen,
    select: (data) => data.content,
  });

  const logVisitMutation = useMutation({
    mutationFn: (data: LogVisitInput) => logVisit(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-visits", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-follow-ups", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-profile-metrics", patientId] });
      toast.success("Visit logged successfully");
      setLogVisitOpen(false);
      resetLogVisitForm();
    },
    onError: (err: any) => {
      const message = typeof err?.response?.data?.message === "string"
        ? err.response.data.message
        : typeof err?.response?.data === "string"
          ? err.response.data
          : "Failed to log visit";
      toast.error(message);
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
        <div className="flex items-center gap-2">
          <Button
            className="bg-indigo-700 text-white hover:bg-indigo-800"
            size="sm"
            onClick={() => setLogVisitOpen(true)}
          >
            <Footprints className="mr-1.5 h-4 w-4" />
            Log Visit
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/patients">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
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

      {/* Tab Navigation */}
      <SegmentedControl
        options={tabOptions}
        value={activeTab}
        onChange={(value) => setActiveTab(value)}
      />

      {/* Tab Content — lazy rendering via short-circuit */}
      {activeTab === "exams" && (
        <EyeExamsPanel patientId={patientId} fullName={fullName} isActive={true} />
      )}
      {activeTab === "prescriptions" && (
        <PrescriptionsPanel patientId={patientId} fullName={fullName} isActive={true} />
      )}
      {activeTab === "followups" && (
        <FollowUpsPanel patientId={patientId} isActive={true} />
      )}
      {activeTab === "timeline" && (
        <VisitTimelinePanel patientId={patientId} isActive={true} />
      )}

      {/* Log Visit Modal */}
      <Dialog open={logVisitOpen} onOpenChange={(open) => { if (!open) { setLogVisitOpen(false); resetLogVisitForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Visit</DialogTitle>
          <DialogDescription>
            Record a walk-in visit for {fullName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Arrival Time</label>
            <div className="flex gap-2 mt-1">
              <input
                type="date"
                className="flex-1 rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:border-gray-400 focus:outline-none"
                value={logVisitDate}
                max={getCurrentLocalDate()}
                onChange={(e) => setLogVisitDate(e.target.value)}
              />
              <input
                type="time"
                className="w-36 rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus:border-gray-400 focus:outline-none"
                style={{ WebkitAppearance: "auto", appearance: "auto" } as unknown as React.CSSProperties}
                value={logVisitTime}
                step="60"
                onChange={(e) => setLogVisitTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Purpose</label>
            <select
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
              value={logVisitPurpose}
              onChange={(e) => setLogVisitPurpose(e.target.value)}
            >
              <option value="">Select purpose...</option>
              <option value="Eye Check-up">Eye Check-up</option>
              <option value="Frame Fitting">Frame Fitting</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Consultation">Consultation</option>
              <option value="Follow-up Visit">Follow-up Visit</option>
              <option value="Adjustment/Repair">Adjustment/Repair</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
              placeholder="Any relevant notes..."
              rows={3}
              value={logVisitNotes}
              onChange={(e) => setLogVisitNotes(e.target.value)}
            />
          </div>
          {pendingFollowUps && pendingFollowUps.length > 0 && (
            <div>
              <label className="text-sm font-medium">Link to Pending Follow-Up (Optional)</label>
              <select
                className="w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background mt-1 focus:border-gray-400 focus:outline-none"
                value={logVisitFollowUp}
                onChange={(e) => setLogVisitFollowUp(e.target.value)}
              >
                <option value="">None</option>
                {pendingFollowUps.map((fu: PatientFollowUp) => (
                  <option key={fu.followUpId} value={fu.followUpId}>
                    {formatDate(fu.scheduledDate)}{fu.followUpReason ? ` — ${fu.followUpReason}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => { setLogVisitOpen(false); resetLogVisitForm(); }}>
            Cancel
          </Button>
          <Button
            className="bg-indigo-700 text-white hover:bg-indigo-800"
            disabled={logVisitMutation.isPending}
            onClick={() => {
              logVisitMutation.mutate({
                visitTimestamp: new Date(`${logVisitDate}T${logVisitTime}:00`).toISOString(),
                purpose: logVisitPurpose || undefined,
                notes: logVisitNotes || undefined,
                followUpId: logVisitFollowUp || undefined,
              });
            }}
          >
            {logVisitMutation.isPending ? "Logging..." : "Log Visit"}
          </Button>
        </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewPatient;
