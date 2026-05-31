import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Stethoscope, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, Plus, Eye, Ban, Copy } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import { toast } from "sonner";
import {
  fetchPatientPrescriptions,
  type PrescriptionListItem,
} from "@/features/patients/services/patientApi";
import { voidPrescription, fetchPrescription } from "@/features/patients/services/prescriptionApi";
import { formatDate, formatDateTime } from "./ViewPatient";

interface PrescriptionsPanelProps {
  patientId: string;
  fullName: string;
  isActive: boolean;
}

const PrescriptionsPanel: React.FC<PrescriptionsPanelProps> = ({ patientId, fullName, isActive }) => {
  const queryClient = useQueryClient();

  const [rxPage, setRxPage] = useState(0);
  const [rxFilter, setRxFilter] = useState("ACTIVE");
  const { data: rxData } = useQuery({
    queryKey: ["patient-prescriptions", patientId, rxPage, rxFilter],
    queryFn: () => fetchPatientPrescriptions(patientId, rxPage, 5, rxFilter),
    placeholderData: keepPreviousData,
    enabled: !!patientId && isActive,
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

  return (
    <>
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

      {/* Void Prescription Confirmation Dialog */}
      <Dialog open={voidRxDialog !== null} onOpenChange={(open) => { if (!open) { setVoidRxDialog(null); setVoidReason(""); } }}>
        <DialogContent>
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
        </DialogContent>
      </Dialog>

      {/* View Prescription Dialog */}
      <Dialog open={viewRxId !== null} onOpenChange={(open) => { if (!open) setViewRxId(null); }}>
        <DialogContent>
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
                                <span className="text-muted-foreground">Add</span>
                                <span className="text-muted-foreground">PD</span>
                                <span>&nbsp;</span>
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
                                <span className="text-muted-foreground">Add</span>
                                <span className="text-muted-foreground">PD</span>
                                <span>&nbsp;</span>
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
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrescriptionsPanel;
