import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  Eye,
  Search,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { createAuditLogsQueryOptions } from "@/features/users/hooks/auditQuery";
import type { AuditLogEntry } from "@/features/users/services/auditApi";
import EmptyTableRows from "@/shared/components/EmptyTableRows";
import JsonDetailsView from "@/shared/components/JsonDetailsView";

const formatTimestamp = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AUDIT_PAGE_SIZE = 10;

const actionBadgeClass: Record<string, string> = {
  CREATE: "bg-emerald-600 hover:bg-emerald-600 text-white",
  UPDATE: "bg-blue-600 hover:bg-blue-600 text-white",
  ARCHIVE: "bg-amber-600 hover:bg-amber-600 text-white",
  RESTORE: "bg-teal-600 hover:bg-teal-600 text-white",
  LOGIN: "bg-purple-600 hover:bg-purple-600 text-white",
  LOGOUT: "bg-gray-600 hover:bg-gray-600 text-white",
  EXPORT: "bg-indigo-600 hover:bg-indigo-600 text-white",
  BACKUP: "bg-sky-600 hover:bg-sky-600 text-white",
  VOID: "bg-rose-600 hover:bg-rose-600 text-white",
  REFUND: "bg-orange-600 hover:bg-orange-600 text-white",
  ADJUSTMENT: "bg-violet-600 hover:bg-violet-600 text-white",
};

const RESOURCE_VIEW_ROUTES: Record<string, string> = {
  PATIENT: "/patients/view/",
  USER: "/users/view/",
  PRODUCT: "/inventory/view/",
  TRANSACTION: "/transactions/",
};

const getResourceViewUrl = (resourceType: string, resourceId: string | null): string | null => {
  const base = RESOURCE_VIEW_ROUTES[resourceType];
  if (!base || !resourceId) return null;
  return base + resourceId;
};

const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const [auditSearch, setAuditSearch] = useState("");
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditResourceFilter, setAuditResourceFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(0);
  const [auditDateFrom, setAuditDateFrom] = useState("");
  const [auditDateTo, setAuditDateTo] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [viewingEntry, setViewingEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuditSearch(auditSearch), 300);
    return () => clearTimeout(timer);
  }, [auditSearch]);

  useEffect(() => {
    setAuditPage(0);
  }, [debouncedAuditSearch, auditActionFilter, auditResourceFilter, auditDateFrom, auditDateTo]);

  const auditParams = {
    keyword: debouncedAuditSearch || undefined,
    actionType: auditActionFilter !== "all" ? auditActionFilter : undefined,
    resourceType: auditResourceFilter !== "all" ? auditResourceFilter : undefined,
    page: auditPage,
    size: AUDIT_PAGE_SIZE,
    minDate: auditDateFrom || undefined,
    maxDate: auditDateTo || undefined,
    sortBy: "loggedAt",
    sortOrder: "desc",
  };

  const { data: auditPageData, isLoading: auditLoading, isFetching: auditFetching, error: auditError } = useQuery({
    ...createAuditLogsQueryOptions(auditParams),
    placeholderData: keepPreviousData,
  });

  const auditLogs = auditPageData?.content ?? [];
  const auditTotalPages = auditPageData?.totalPages ?? 0;

  // DEBUG: trace pagination state
  console.log("[AuditLogs]", { page: auditPage, totalPages: auditTotalPages, entries: auditLogs.length, totalElements: auditPageData?.totalElements, fetching: auditFetching, error: auditError, dataShape: auditPageData ? Object.keys(auditPageData) : null });

  useEffect(() => {
    if (auditLogs.length === 0 && auditPage > 0 && !auditFetching) {
      setAuditPage((p) => Math.max(0, p - 1));
    }
  }, [auditLogs.length, auditPage, auditFetching]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Audit Trail</h2>
        <p className="text-muted-foreground">
          View and track all system activity and changes.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search audit trail..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Date Range:</span>
                <Input
                  type="date"
                  value={auditDateFrom}
                  max={today}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAuditDateFrom(v);
                    if (auditDateTo && v && auditDateTo < v) setAuditDateTo("");
                  }}
                  className="w-[150px]"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={auditDateTo}
                  min={auditDateFrom || undefined}
                  max={today}
                  onChange={(e) => setAuditDateTo(e.target.value)}
                  className="w-[150px]"
                />
                {(auditDateFrom || auditDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAuditDateFrom(""); setAuditDateTo(""); }}
                    className="text-xs text-muted-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Action:</span>
                <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="CREATE">Create</SelectItem>
                    <SelectItem value="UPDATE">Update</SelectItem>
                    <SelectItem value="ARCHIVE">Archive</SelectItem>
                    <SelectItem value="RESTORE">Restore</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                    <SelectItem value="LOGOUT">Logout</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                    <SelectItem value="BACKUP">Backup</SelectItem>
                    <SelectItem value="VOID">Void</SelectItem>
                    <SelectItem value="REFUND">Refund</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Resource:</span>
                <Select value={auditResourceFilter} onValueChange={setAuditResourceFilter}>
                  <SelectTrigger className="w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    <SelectItem value="PATIENT">Patient</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                    <SelectItem value="PRESCRIPTION_ITEM">Prescription Item</SelectItem>
                    <SelectItem value="HEALTH_HISTORY">Health History</SelectItem>
                    <SelectItem value="TRANSACTION">Transaction</SelectItem>
                    <SelectItem value="TRANSACTION_ITEMS">Transaction Items</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="REPORT">Report</SelectItem>
                    <SelectItem value="DATABASE">Database</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {auditLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[18%] py-3 pr-4 font-medium">Date & Time</th>
                      <th className="w-[12%] py-3 pr-4 font-medium text-center">Action</th>
                      <th className="w-[14%] py-3 pr-4 font-medium">Resource</th>
                      <th className="w-[34%] py-3 pr-4 font-medium">Details</th>
                      <th className="w-[16%] py-3 pr-4 font-medium">Performed by</th>
                      <th className="w-[6%] py-3 pl-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((entry) => (
                      <tr
                        key={entry.logId}
                        className="border-b transition-colors hover:bg-muted"
                      >
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{formatTimestamp(entry.loggedAt)}</span>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <Badge className={actionBadgeClass[entry.actionType] || "bg-gray-600 hover:bg-gray-600 text-white"}>
                            {entry.actionType}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{entry.resourceType.replace(/_/g, " ")}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{entry.details}</span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          <span className="block truncate">{entry.userName}</span>
                        </td>
                        <td className="py-3 pl-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingEntry(entry)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <EmptyTableRows
                      count={AUDIT_PAGE_SIZE - (auditLogs?.length ?? 0)}
                      colSpan={6}
                      className="h-[57px]"
                    />
                  </tbody>
                </table>
              </div>

              {auditLogs.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No audit trail entries found.
                </p>
              )}

              {auditTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {auditPage + 1} of {auditTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => p - 1)}
                      disabled={auditPage === 0}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAuditPage((p) => p + 1)}
                      disabled={auditPage >= auditTotalPages - 1}
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

      {/* Audit Log View Dialog */}
      <Dialog open={!!viewingEntry} onOpenChange={(open) => !open && setViewingEntry(null)}>
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                Full details of the selected audit log entry.
              </DialogDescription>
            </div>
            {viewingEntry && getResourceViewUrl(viewingEntry.resourceType, viewingEntry.resourceId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = getResourceViewUrl(viewingEntry.resourceType, viewingEntry.resourceId);
                  if (url) navigate(url);
                }}
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                View Resource
              </Button>
            )}
          </div>
        </DialogHeader>
        {viewingEntry && (
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-xs text-muted-foreground">Log ID</Label>
              <p className="text-sm font-mono">{viewingEntry.logId}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Date & Time</Label>
              <p className="text-sm">{formatTimestamp(viewingEntry.loggedAt)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Action</Label>
                <p className="text-sm">
                  <Badge className={actionBadgeClass[viewingEntry.actionType] || "bg-gray-600 hover:bg-gray-600 text-white"}>
                    {viewingEntry.actionType}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Resource Type</Label>
                <p className="text-sm">{viewingEntry.resourceType.replace(/_/g, " ")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Performed by</Label>
                <p className="text-sm">{viewingEntry.userName}</p>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Details</Label>
              <p className="text-sm mt-1 rounded-lg border bg-muted/50 p-3">{viewingEntry.details}</p>
            </div>
            {viewingEntry.detailsJson && (() => {
              try {
                const parsed = JSON.parse(viewingEntry.detailsJson);
                return (
                  <div>
                    <Label className="text-xs text-muted-foreground">Structured Details</Label>
                    <div className="mt-1 rounded-lg border bg-muted/50 p-3">
                      <JsonDetailsView data={parsed} />
                    </div>
                  </div>
                );
              } catch {
                return (
                  <div>
                    <Label className="text-xs text-muted-foreground">Details (Raw)</Label>
                    <pre className="text-xs mt-1 rounded-lg border bg-muted/50 p-3 overflow-x-auto whitespace-pre-wrap">
                      {viewingEntry.detailsJson}
                    </pre>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default AuditLogs;
