import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Calendar, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Pencil, Archive, Undo2, UserX, XCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchFollowUpsByPatient,
  updateFollowUpStatus,
  createFollowUp,
  updateFollowUp,
  archiveFollowUp,
  restoreFollowUp,
  type PatientFollowUp,
  type CreateFollowUpInput,
} from "@/features/patients/services/followUpApi";
import {
  fetchPatientPrescriptions,
  fetchPatientEyeExams,
  type PrescriptionListItem,
  type EyeExamListItem,
} from "@/features/patients/services/patientApi";
import { formatDate, formatDateTime } from "./ViewPatient";

interface FollowUpsPanelProps {
  patientId: string;
  isActive: boolean;
}

const getCurrentLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const FollowUpsPanel: React.FC<FollowUpsPanelProps> = ({ patientId, isActive }) => {
  const queryClient = useQueryClient();

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
    enabled: !!patientId && isActive,
  });

  const [fuModal, setFuModal] = useState<{ open: boolean; edit: PatientFollowUp | null }>({ open: false, edit: null });
  const [fuForm, setFuForm] = useState({ scheduledDate: "", followUpReason: "", prescriptionId: "", eyeExamId: "" });

  // Lightweight lists for link dropdowns in the follow-up modal
  const { data: rxList } = useQuery({
    queryKey: ["patient-prescriptions-list", patientId],
    queryFn: () => fetchPatientPrescriptions(patientId, 0, 100, "ACTIVE"),
    enabled: fuModal.open,
    select: (data) => data.content,
  });

  const { data: eeList } = useQuery({
    queryKey: ["patient-eye-exams-list", patientId],
    queryFn: () => fetchPatientEyeExams(patientId, 0, 100, "ACTIVE"),
    enabled: fuModal.open,
    select: (data) => data.content,
  });

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

  return (
    <>
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
                        <div className="w-[90px]" />
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

      {/* Follow-Up Management Modal */}
      <Dialog open={fuModal.open} onOpenChange={(open) => { if (!open) setFuModal({ open: false, edit: null }); }}>
        <DialogContent>
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
                min={getCurrentLocalDate()}
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
                {rxList?.map((rx: PrescriptionListItem) => (
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
                {eeList?.map((ee: EyeExamListItem) => (
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FollowUpsPanel;
