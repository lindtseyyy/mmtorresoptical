import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  HardDriveDownload,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  X,
  TriangleAlert,
  FileArchive,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog";
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
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { downloadBackup, restoreBackup, fetchLastBackup, fetchLastRestore, readMetadataFromFile } from "@/features/admin/services/databaseApi";
import { createAuditLogsQueryOptions } from "@/features/users/hooks/auditQuery";
import type { BackupFileMetadata } from "@/features/admin/services/databaseApi";
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

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

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

const DatabaseBackup: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Segmented control ──
  const [activeTab, setActiveTab] = useState("backup-restore");

  // ── Backup state ──
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  const [showBackupPassword, setShowBackupPassword] = useState(false);

  const { data: lastBackup } = useQuery({
    queryKey: ["lastBackup"],
    queryFn: fetchLastBackup,
  });

  const { data: lastRestore } = useQuery({
    queryKey: ["lastRestore"],
    queryFn: fetchLastRestore,
  });

  // ── Restore state ──
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<BackupFileMetadata | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");
  const [restorePassword, setRestorePassword] = useState("");
  const [showRestorePassword, setShowRestorePassword] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Audit log state ──
  const [auditSearch, setAuditSearch] = useState("");
  const [debouncedAuditSearch, setDebouncedAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditResourceFilter, setAuditResourceFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(0);
  const [viewingEntry, setViewingEntry] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuditSearch(auditSearch), 300);
    return () => clearTimeout(timer);
  }, [auditSearch]);

  useEffect(() => {
    setAuditPage(0);
  }, [debouncedAuditSearch, auditActionFilter, auditResourceFilter]);

  const auditParams = {
    keyword: debouncedAuditSearch || undefined,
    actionType: auditActionFilter !== "all" ? auditActionFilter : undefined,
    resourceType: auditResourceFilter !== "all" ? auditResourceFilter : undefined,
    page: auditPage,
    size: AUDIT_PAGE_SIZE,
    sortBy: "loggedAt",
    sortOrder: "desc",
  };

  const { data: auditPageData, isLoading: auditLoading, isFetching: auditFetching } = useQuery({
    ...createAuditLogsQueryOptions(auditParams),
    placeholderData: keepPreviousData,
  });

  const auditLogs = auditPageData?.content ?? [];
  const auditTotalPages = auditPageData?.totalPages ?? 0;

  useEffect(() => {
    if (auditLogs.length === 0 && auditPage > 0 && !auditFetching) {
      setAuditPage((p) => Math.max(0, p - 1));
    }
  }, [auditLogs.length, auditPage, auditFetching]);

  // ── Mutations ──

  const backupMutation = useMutation({
    mutationFn: (password: string) => downloadBackup(password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lastBackup"] });
      toast.success("Backup downloaded successfully.");
      setBackupDialogOpen(false);
      setBackupPassword("");
      setShowBackupPassword(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Backup failed.");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      restoreBackup(file, password),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ["lastBackup"] });
      queryClient.invalidateQueries({ queryKey: ["lastRestore"] });
      toast.success(message);
      setRestoreDialogOpen(false);
      setSelectedFile(null);
      setFileMetadata(null);
      setRestoreConfirmText("");
      setRestorePassword("");
      setShowRestorePassword(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Restore failed.");
    },
  });

  // ── File handling ──

  const validateAndSetFile = async (file: File) => {
    if (!file.name.endsWith(".dump")) {
      toast.error("Invalid file type. Please provide a .dump backup file.");
      return;
    }
    setSelectedFile(file);
    const metadata = await readMetadataFromFile(file);
    setFileMetadata(metadata);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  }, []);

  const clearFile = () => {
    setSelectedFile(null);
    setFileMetadata(null);
  };

  // ── Restore overlay ──

  useEffect(() => {
    if (restoreMutation.isPending) {
      document.body.style.overflow = "hidden";
      overlayTimerRef.current = setTimeout(() => setShowOverlay(true), 800);
    } else {
      document.body.style.overflow = "";
      setShowOverlay(false);
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
        overlayTimerRef.current = undefined;
      }
    }
    return () => {
      document.body.style.overflow = "";
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    };
  }, [restoreMutation.isPending]);

  // ── Render ──

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Maintenance</h2>
        <p className="text-muted-foreground">
          Manage database maintenance, backups, restore data, and view audit trail.
        </p>
      </div>

      {/* Segmented Control */}
      <SegmentedControl
        options={[
          { value: "backup-restore", label: "Backup & Restore" },
          { value: "audit-logs", label: "Audit Trail" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Backup & Restore Tab ── */}
      {activeTab === "backup-restore" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-start">
          {/* ── Backup Card ── */}
          <Card className="border-t-4 border-t-emerald-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
                  <HardDriveDownload className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <CardTitle>Backup Database</CardTitle>
                  <CardDescription>Download a copy of your data</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Last Backup</p>
                <p className="text-sm font-medium">
                  {lastBackup?.timestamp ? formatTimestamp(lastBackup.timestamp) : "No backups yet"}
                </p>
                {lastBackup?.performedBy && (
                  <p className="text-xs text-muted-foreground">by {lastBackup.performedBy}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Creates a copy of all patients, appointments, and records.
              </p>
              <Button
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                size="lg"
                onClick={() => setBackupDialogOpen(true)}
                disabled={backupMutation.isPending}
              >
                <HardDriveDownload className="mr-2 h-4 w-4" />
                {backupMutation.isPending ? "Generating Backup..." : "Download Latest Backup"}
              </Button>
            </CardContent>
          </Card>

          {/* ── Restore Card ── */}
          <Card className="border-t-4 border-t-amber-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10">
                  <Upload className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>Restore Database</CardTitle>
                  <CardDescription>Upload a backup file to restore</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Last Restore</p>
                <p className="text-sm font-medium">
                  {lastRestore?.timestamp ? formatTimestamp(lastRestore.timestamp) : "No restores yet"}
                </p>
                {lastRestore?.performedBy && (
                  <p className="text-xs text-muted-foreground">by {lastRestore.performedBy}</p>
                )}
                {lastRestore?.backupPerformedBy && (
                  <>
                    <hr className="my-2 border-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Restored from backup by</p>
                    <p className="text-sm font-medium">{lastRestore.backupPerformedBy}</p>
                    {lastRestore.backupTimestamp && (
                      <p className="text-xs text-muted-foreground">{formatTimestamp(lastRestore.backupTimestamp)}</p>
                    )}
                  </>
                )}
              </div>
              {/* Drop zone */}
              <div
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                  isDragOver
                    ? "border-amber-500 bg-amber-500/5"
                    : "border-muted-foreground/25 hover:border-amber-500/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-start gap-3">
                    <FileArchive className="mt-0.5 h-8 w-8 shrink-0 text-amber-600" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      {fileMetadata && (
                        <div className="mt-1 rounded bg-amber-500/10 px-2 py-1">
                          <p className="text-xs text-muted-foreground">
                            Backup by <span className="font-medium text-foreground">{fileMetadata.performedBy}</span>
                            {" · "}
                            {formatTimestamp(fileMetadata.backupTimestamp)}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ml-2 rounded-full p-1 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Drag & drop a .dump file here
                    </p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dump"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              <p className="flex items-center gap-1 text-sm text-red-600">
                <TriangleAlert className="h-4 w-4" />
                Warning: Existing data will be replaced by the backup file.
              </p>
              <Button
                className="w-full bg-amber-600 text-white hover:bg-amber-700"
                size="lg"
                disabled={!selectedFile}
                onClick={() => setRestoreDialogOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload & Restore Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Audit Logs Tab ── */}
      {activeTab === "audit-logs" && (
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
                            <span className="block truncate">{entry.resourceType}</span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            <span className="block truncate">{entry.details}</span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            <span className="block truncate font-mono text-xs">{entry.userId}</span>
                          </td>
                          <td className="py-3 pl-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-10 w-10 shrink-0 p-0 [&_svg]:size-auto focus-visible:ring-0">
                                  <MoreHorizontal className="h-8 w-8" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                                <DropdownMenuItem onClick={() => setViewingEntry(entry)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                      <EmptyTableRows
                        count={AUDIT_PAGE_SIZE - (auditLogs?.length ?? 0)}
                        colSpan={6}
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
      )}

      {/* ── Audit Log View Dialog ── */}
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
                <p className="text-sm">{viewingEntry.resourceType}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Performed by</Label>
                <p className="text-sm font-mono">{viewingEntry.userId}</p>
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

      {/* ── Backup Password Dialog ── */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogHeader>
          <DialogTitle>Download Backup</DialogTitle>
          <DialogDescription>
            Enter your password to generate and download the database backup.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="backup-password">Password</Label>
            <div className="relative">
              <Input
                id="backup-password"
                type={showBackupPassword ? "text" : "password"}
                placeholder="Enter your password to confirm"
                className="pr-10"
                value={backupPassword}
                onChange={(e) => setBackupPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && backupPassword) {
                    backupMutation.mutate(backupPassword);
                  }
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowBackupPassword(!showBackupPassword)}
                tabIndex={-1}
              >
                {showBackupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setBackupDialogOpen(false);
                setBackupPassword("");
                setShowBackupPassword(false);
              }}
              disabled={backupMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => backupMutation.mutate(backupPassword)}
              disabled={!backupPassword || backupMutation.isPending}
            >
              {backupMutation.isPending ? "Generating..." : "Download"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Restore Confirmation Dialog ── */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-5 w-5 text-red-500" />
            <DialogTitle>Restore Database</DialogTitle>
          </div>
          <DialogDescription>
            Warning: This will overwrite all current clinic data. Are you sure you want to proceed?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {fileMetadata && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Backup File Info</p>
              <p className="text-sm font-medium">
                {formatTimestamp(fileMetadata.backupTimestamp)}
              </p>
              <p className="text-xs text-muted-foreground">by {fileMetadata.performedBy}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="restore-confirm">Type RESTORE to confirm</Label>
            <Input
              id="restore-confirm"
              placeholder='Type "RESTORE" to confirm'
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="restore-password">Password</Label>
            <div className="relative">
              <Input
                id="restore-password"
                type={showRestorePassword ? "text" : "password"}
                placeholder="Enter your password to confirm"
                className="pr-10"
                value={restorePassword}
                onChange={(e) => setRestorePassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && restoreConfirmText === "RESTORE" && restorePassword) {
                    restoreMutation.mutate({ file: selectedFile!, password: restorePassword });
                  }
                }}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowRestorePassword(!showRestorePassword)}
                tabIndex={-1}
              >
                {showRestorePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setRestoreDialogOpen(false);
                setRestoreConfirmText("");
                setRestorePassword("");
                setShowRestorePassword(false);
              }}
              disabled={restoreMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="text-white"
              onClick={() =>
                restoreMutation.mutate({ file: selectedFile!, password: restorePassword })
              }
              disabled={restoreConfirmText !== "RESTORE" || !restorePassword || restoreMutation.isPending}
            >
              {restoreMutation.isPending ? "Restoring..." : "Restore Database"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Restore Loading Overlay ── */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-sm text-center shadow-lg">
            <CardContent className="p-8">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
              <CardTitle className="mb-2">Restoring Database...</CardTitle>
              <CardDescription>
                Please do not refresh or close this page. The restore process may take a few minutes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DatabaseBackup;
