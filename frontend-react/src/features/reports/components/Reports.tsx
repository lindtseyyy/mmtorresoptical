import { useState } from "react";
import {
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import SegmentedControl from "@/shared/components/ui/segmented-control";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useReportData, usePatientGrowthTrend, useLowStockProducts, useOverstockedProducts, useOutOfStockProducts } from "@/features/reports/hooks/reportQuery";
import { downloadPdfReport, downloadExcelReport } from "@/features/reports/services/reportApi";
import { createTransactionMetricsQueryOptions } from "@/features/sales/hooks/transactionQuery";
import InventoryValueChart from "@/features/reports/components/inventory/InventoryValueChart";
import CategoryBreakdownChart from "@/features/reports/components/inventory/CategoryBreakdownChart";
import TopSellingProductsTable from "@/features/reports/components/inventory/TopSellingProductsTable";
import LowStockProductsTable from "@/features/reports/components/inventory/LowStockProductsTable";
import OverstockedProductsTable from "@/features/reports/components/inventory/OverstockedProductsTable";
import OutOfStockProductsTable from "@/features/reports/components/inventory/OutOfStockProductsTable";
import TransactionReport from "@/features/reports/components/transaction/TransactionReport";
import PatientReport from "@/features/reports/components/patient/PatientReport";
import type {
  ComprehensiveInventoryReportDataset,
  PatientReportDataset,
  TransactionHierarchicalReportDataset,
} from "@/features/reports/types";

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
  const [lowStockPage, setLowStockPage] = useState(0);
  const [overstockedPage, setOverstockedPage] = useState(0);
  const [outOfStockPage, setOutOfStockPage] = useState(0);
  const PAGE_SIZE = 10;

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

  const {
    data: lowStockData,
    isLoading: lowStockLoading,
  } = useLowStockProducts(lowStockPage, PAGE_SIZE);

  const {
    data: overstockedData,
    isLoading: overstockedLoading,
  } = useOverstockedProducts(overstockedPage, PAGE_SIZE);

  const {
    data: outOfStockData,
    isLoading: outOfStockLoading,
  } = useOutOfStockProducts(outOfStockPage, PAGE_SIZE);

  const { data: transactionMetrics } = useQuery({
    ...createTransactionMetricsQueryOptions(),
    enabled: reportType === "TRANSACTIONS",
  });

  const { data: growthTrend } = usePatientGrowthTrend();

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
      {/* Charts replacing static cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InventoryValueChart />
        <CategoryBreakdownChart />
      </div>

      <TopSellingProductsTable products={report.topSellingProducts} />

      <LowStockProductsTable
        data={lowStockData}
        isLoading={lowStockLoading}
        page={lowStockPage}
        onPageChange={setLowStockPage}
        pageSize={PAGE_SIZE}
      />

      <OverstockedProductsTable
        data={overstockedData}
        isLoading={overstockedLoading}
        page={overstockedPage}
        onPageChange={setOverstockedPage}
        pageSize={PAGE_SIZE}
      />

      <OutOfStockProductsTable
        data={outOfStockData}
        isLoading={outOfStockLoading}
        page={outOfStockPage}
        onPageChange={setOutOfStockPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );

  // ── Patient report ───────────────────────────────────────────────

  // ── Main render ──────────────────────────────────────────────────

  const renderReportContent = () => {
    if (isLoading) return renderLoading();
    if (isError) return renderError();
    if (!data) return renderEmpty();

    switch (reportType) {
      case "INVENTORY_ANALYTICS":
        return renderInventoryReport(data as ComprehensiveInventoryReportDataset);
      case "TRANSACTIONS":
        return (
          <TransactionReport
            report={data as TransactionHierarchicalReportDataset}
            transactionMetrics={transactionMetrics}
            minDate={minDate}
            maxDate={maxDate}
            onMinDateChange={setMinDate}
            onMaxDateChange={setMaxDate}
          />
        );
      case "PATIENTS":
        return (
          <PatientReport
            report={data as PatientReportDataset}
            growthTrend={growthTrend ?? []}
            minDate={minDate}
            maxDate={maxDate}
            onMinDateChange={setMinDate}
            onMaxDateChange={setMaxDate}
          />
        );
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

      {/* Report content */}
      {(reportType === "TRANSACTIONS" || reportType === "PATIENTS") ? (
        renderReportContent()
      ) : (
        <Card>
          <CardContent className="p-6">{renderReportContent()}</CardContent>
        </Card>
      )}

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
