package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.auditlog.resources.ReportAuditHelper;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxInventoryAnalyticsReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxPatientReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxTransactionReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf.TransactionHierarchicalReportDataset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final ReportAggregationService reportAggregationService;
    private final TransactionPdfAggregationService transactionPdfAggregationService;
    private final PdfBoxInventoryAnalyticsReportGenerator pdfBoxInventoryAnalyticsReportGenerator;
    private final PdfBoxTransactionReportGenerator pdfBoxTransactionReportGenerator;
    private final PdfBoxPatientReportGenerator pdfBoxPatientReportGenerator;
    private final ReportAuditHelper reportAuditHelper;

    public byte[] exportReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        return switch (reportType) {
            case TRANSACTIONS -> {
                if (minDate == null || maxDate == null) {
                    throw new BadRequestException(
                            "Both minDate and maxDate are required for transaction reports.");
                }
                TransactionHierarchicalReportDataset dataset =
                        transactionPdfAggregationService.buildTransactionReport(minDate, maxDate);
                byte[] pdf = pdfBoxTransactionReportGenerator.generate(dataset);
                reportAuditHelper.logExport(dataset.getMetadata(), minDate, maxDate);
                yield pdf;
            }
            case INVENTORY_ANALYTICS -> {
                ComprehensiveInventoryReportDataset dataset =
                        reportAggregationService.buildInventoryAnalyticsReport();
                byte[] pdf = pdfBoxInventoryAnalyticsReportGenerator.generate(dataset);
                reportAuditHelper.logExport(dataset.getMetadata(), null, null);
                yield pdf;
            }
            case PATIENTS -> {
                PatientReportDataset dataset =
                        reportAggregationService.buildPatientReport(reportType, minDate, maxDate);
                byte[] pdf = pdfBoxPatientReportGenerator.generate(dataset);
                reportAuditHelper.logExport(dataset.getMetadata(), minDate, maxDate);
                yield pdf;
            }
        };
    }
}
