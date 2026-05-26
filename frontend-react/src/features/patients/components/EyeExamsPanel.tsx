import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Stethoscope, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Eye, Ban } from "lucide-react";
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
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchPatientEyeExams,
  type EyeExamListItem,
} from "@/features/patients/services/patientApi";
import { getEyeExam, voidEyeExam } from "@/features/patients/services/eyeExamApi";
import { formatEyeExamDateTime, formatDateTime } from "./ViewPatient";

interface EyeExamsPanelProps {
  patientId: string;
  fullName: string;
  isActive: boolean;
}

const EyeExamsPanel: React.FC<EyeExamsPanelProps> = ({ patientId, fullName, isActive }) => {
  const queryClient = useQueryClient();

  const [eePage, setEePage] = useState(0);
  const [eeFilter, setEeFilter] = useState("ACTIVE");
  const { data: eeData } = useQuery({
    queryKey: ["patient-eye-exams", patientId, eePage, eeFilter],
    queryFn: () => fetchPatientEyeExams(patientId, eePage, 5, eeFilter),
    placeholderData: keepPreviousData,
    enabled: !!patientId && isActive,
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

  return (
    <>
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
    </>
  );
};

export default EyeExamsPanel;
