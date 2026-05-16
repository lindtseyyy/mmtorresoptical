import { useState } from "react";
import {
  FileText,
  Download,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import StatusBadge from "@/shared/components/ui/StatusBadge";
import { useReportData } from "@/features/reports/hooks/reportQuery";
import { downloadPdfReport, downloadExcelReport } from "@/features/reports/services/reportApi";
import type {
  ComprehensiveInventoryReportDataset,
  PatientReportDataset,
  TransactionHierarchicalReportDataset,
  TransactionEntry,
} from "@/features/reports/types";

// ── Helpers ───────────────────────────────────────────────────────────

const currency = (value: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

const number = (value: number) => new Intl.NumberFormat("en-PH").format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const MIN_DATE_LOCAL = "2020-01-01";
const MAX_DATE_LOCAL = "2099-12-31";

// ── Report type options ───────────────────────────────────────────────

const REPORT_TYPE_OPTIONS = [
  { value: "INVENTORY_ANALYTICS", label: "Inventory Analytics" },
  { value: "TRANSACTIONS", label: "Transactions" },
  { value: "PATIENTS", label: "Patients" },
];

// ── Component ─────────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState("INVENTORY_ANALYTICS");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useReportData(
    reportType,
    minDate || undefined,
    maxDate || undefined
  );

  const needsDates = reportType === "TRANSACTIONS";
  const canExportExcel = reportType !== "INVENTORY_ANALYTICS";

  // ── Export handlers ──────────────────────────────────────────────

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadPdfReport(reportType, minDate || undefined, maxDate || undefined);
      toast.success("PDF report downloaded.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await downloadExcelReport(reportType, minDate || undefined, maxDate || undefined);
      toast.success("Excel report downloaded.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to export Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────────────

  const renderLoading = () => (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const renderError = () => (
    <Card className="border-red-300 bg-red-50">
      <CardContent className="flex items-center gap-3 py-6">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <div className="flex-1">
          <p className="font-medium text-red-800">Failed to load report</p>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
      <FileText className="h-10 w-10" />
      <p>No data available for the selected report.</p>
    </div>
  );

  // ── Inventory report ─────────────────────────────────────────────

  const renderInventoryReport = (report: ComprehensiveInventoryReportDataset) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{currency(report.totalInventoryValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{report.totalLowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overstocked Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{report.totalOverstockCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      {report.topSellingProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[30%] py-3 pr-4 font-medium">Product</th>
                    <th className="w-[20%] py-3 pr-4 font-medium">Category</th>
                    <th className="w-[16%] py-3 pr-4 font-medium text-right">Unit Price</th>
                    <th className="w-[16%] py-3 pr-4 font-medium text-right">Units Sold</th>
                    <th className="w-[18%] py-3 pr-4 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topSellingProducts.map((p) => (
                    <tr key={p.productId} className="border-b hover:bg-muted">
                      <td className="py-3 pr-4 font-medium">{p.productName}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">
                        {p.category.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 pr-4 text-right">{currency(p.unitPrice)}</td>
                      <td className="py-3 pr-4 text-right">{p.totalSold}</td>
                      <td className="py-3 pr-4 text-right font-medium">{currency(p.totalRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Products */}
      {report.lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[35%] py-3 pr-4 font-medium">Product</th>
                    <th className="w-[20%] py-3 pr-4 font-medium">Category</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Quantity</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Threshold</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lowStockProducts.map((p) => (
                    <tr key={p.productId} className="border-b hover:bg-muted">
                      <td className="py-3 pr-4 font-medium">{p.productName}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">
                        {p.category.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 pr-4 text-right text-yellow-600 font-medium">{p.quantity}</td>
                      <td className="py-3 pr-4 text-right">{p.lowLevelThreshold}</td>
                      <td className="py-3 pr-4 text-right">{currency(p.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overstocked Products */}
      {report.overstockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overstocked Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[35%] py-3 pr-4 font-medium">Product</th>
                    <th className="w-[20%] py-3 pr-4 font-medium">Category</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Quantity</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Threshold</th>
                    <th className="w-[15%] py-3 pr-4 font-medium text-right">Unit Price</th>
                  </tr>
                </thead>
                <tbody>
                  {report.overstockProducts.map((p) => (
                    <tr key={p.productId} className="border-b hover:bg-muted">
                      <td className="py-3 pr-4 font-medium">{p.productName}</td>
                      <td className="py-3 pr-4 capitalize text-muted-foreground">
                        {p.category.replace(/_/g, " ")}
                      </td>
                      <td className="py-3 pr-4 text-right text-blue-600 font-medium">{p.quantity}</td>
                      <td className="py-3 pr-4 text-right">{p.overstockedThreshold}</td>
                      <td className="py-3 pr-4 text-right">{currency(p.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Transaction report ───────────────────────────────────────────

  const TransactionRow: React.FC<{ entry: TransactionEntry }> = ({ entry }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="border-b">
        <button
          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-[100px] font-mono text-sm">
            {formatDate(entry.date)}
          </span>
          <span className="flex-1 font-medium">{entry.customerName || "Walk-in"}</span>
          <StatusBadge status={entry.status} className="shrink-0" />
          <span className="min-w-[100px] text-right font-medium">
            {currency(entry.totalAmount)}
          </span>
        </button>
        {expanded && (
          <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Cashier: </span>
                <span>{entry.cashierName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Amount Paid: </span>
                <span>{currency(entry.amountPaid)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Balance Due: </span>
                <span>{currency(entry.balanceDue)}</span>
              </div>
              {entry.voidReason && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Void Reason: </span>
                  <span className="text-red-600">{entry.voidReason}</span>
                  {entry.voidedAt && (
                    <span className="text-muted-foreground text-xs ml-2">
                      ({formatDateTime(entry.voidedAt)}
                      {entry.voidedBy ? ` by ${entry.voidedBy}` : ""})
                    </span>
                  )}
                </div>
              )}
            </div>

            {entry.items.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Items</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1 pr-2">Product</th>
                      <th className="py-1 pr-2 text-right">Qty</th>
                      <th className="py-1 pr-2 text-right">Unit Price</th>
                      <th className="py-1 pr-2 text-right">Subtotal</th>
                      {entry.items.some((i) => i.refundedQuantity) && (
                        <th className="py-1 pr-2 text-right">Refunded</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {entry.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-muted">
                        <td className="py-1 pr-2">{item.productName}</td>
                        <td className="py-1 pr-2 text-right">{item.quantity}</td>
                        <td className="py-1 pr-2 text-right">{currency(item.unitPrice)}</td>
                        <td className="py-1 pr-2 text-right">{currency(item.subtotal)}</td>
                        {entry.items.some((i) => i.refundedQuantity) && (
                          <td className="py-1 pr-2 text-right">
                            {item.refundedQuantity
                              ? `${item.refundedQuantity}${item.refundAmount ? ` (${currency(item.refundAmount)})` : ""}`
                              : "-"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {entry.payments.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Payments</p>
                <div className="space-y-1">
                  {entry.payments.map((pmt, idx) => (
                    <div key={idx} className="flex items-center gap-4 text-xs">
                      <Badge variant="outline" className="capitalize">
                        {pmt.paymentMethod}
                      </Badge>
                      <span className="font-medium">{currency(pmt.amount)}</span>
                      {pmt.referenceNumber && (
                        <span className="text-muted-foreground">Ref: {pmt.referenceNumber}</span>
                      )}
                      <span className="text-muted-foreground">{formatDateTime(pmt.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTransactionReport = (report: TransactionHierarchicalReportDataset) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{number(report.summary.totalCount)}</p>
            <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{number(report.summary.completedCount)}</p>
            <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.completedAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voided</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{number(report.summary.voidedCount)}</p>
            <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.voidedAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">{number(report.summary.refundedCount)}</p>
            <p className="text-sm text-muted-foreground mt-1">{currency(report.summary.refundedAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Status groups */}
      {Object.keys(report.statusGroups).length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{report.emptyMessage}</p>
      ) : (
        Object.entries(report.statusGroups).map(([status, entries]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
                <CardTitle className="text-base">
                  {status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </CardTitle>
                <span className="text-sm text-muted-foreground">({entries.length})</span>
              </div>
            </CardHeader>
            <CardContent>
              {entries.map((entry) => (
                <TransactionRow key={entry.id} entry={entry} />
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  // ── Patient report ───────────────────────────────────────────────

  const renderPatientReport = (report: PatientReportDataset) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{number(report.totalPatients)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{number(report.activePatients)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-500">{number(report.archivedPatients)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {report.overallReport ? "New This Month" : "New in Period"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{number(report.newPatientsInPeriod)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Gender distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Male</span>
                <span className="font-medium">{report.maleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Female</span>
                <span className="font-medium">{report.femaleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Others</span>
                <span className="font-medium">{report.otherGenderCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Age group distribution */}
        {report.ageGroupDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Age Groups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.ageGroupDistribution.map((ag) => (
                  <div key={ag.groupLabel} className="flex items-center justify-between">
                    <span>{ag.groupLabel}</span>
                    <span className="font-medium">{ag.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visit statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Visit Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{number(report.totalVisits)}</p>
              <p className="text-sm text-muted-foreground">Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{number(report.completedVisits)}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{number(report.missedOrCancelledVisits)}</p>
              <p className="text-sm text-muted-foreground">Missed / Cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth comparison */}
      {report.growthComparisonAvailable && (
        <Card>
          <CardHeader>
            <CardTitle>Growth Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">{report.previousPeriodLabel}</p>
                <p className="text-xl font-bold">{number(report.previousPeriodCount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{report.currentPeriodLabel}</p>
                <p className="text-xl font-bold">{number(report.currentPeriodCount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth</p>
                <p
                  className={`text-xl font-bold ${
                    report.growthPercentage >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {report.growthPercentage >= 0 ? "+" : ""}
                  {report.growthPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────

  const renderReportContent = () => {
    if (isLoading) return renderLoading();
    if (isError) return renderError();
    if (!data) return renderEmpty();

    switch (reportType) {
      case "INVENTORY_ANALYTICS":
        return renderInventoryReport(data as ComprehensiveInventoryReportDataset);
      case "TRANSACTIONS":
        return renderTransactionReport(data as TransactionHierarchicalReportDataset);
      case "PATIENTS":
        return renderPatientReport(data as PatientReportDataset);
      default:
        return renderEmpty();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Reports</h2>
        <p className="text-muted-foreground">
          View and export reports for inventory, transactions, and patients.
        </p>
      </div>

      {/* Report type selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          options={REPORT_TYPE_OPTIONS}
          value={reportType}
          onChange={(value) => {
            setReportType(value);
            if (value !== "TRANSACTIONS") {
              setMinDate("");
              setMaxDate("");
            }
          }}
        />

        {/* Date range filters */}
        {(needsDates || reportType === "PATIENTS") && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              min={MIN_DATE_LOCAL}
              max={MAX_DATE_LOCAL}
              value={minDate}
              onChange={(e) => setMinDate(e.target.value)}
              className="w-auto"
            />
            <span className="text-muted-foreground text-sm">to</span>
            <Input
              type="date"
              min={MIN_DATE_LOCAL}
              max={MAX_DATE_LOCAL}
              value={maxDate}
              onChange={(e) => setMaxDate(e.target.value)}
              className="w-auto"
            />
          </div>
        )}
      </div>

      {/* Required date hint for transactions */}
      {needsDates && (!minDate || !maxDate) && !isLoading && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              Select a date range above to generate the Transactions report.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report content */}
      <Card>
        <CardContent className="p-6">{renderReportContent()}</CardContent>
      </Card>

      {/* Export action bar */}
      {data && !isLoading && (
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportingPdf ? "Exporting..." : "Export as PDF"}
          </Button>
          {canExportExcel && (
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={exportingExcel}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportingExcel ? "Exporting..." : "Export as Excel"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
