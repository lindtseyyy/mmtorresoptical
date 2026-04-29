package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxInventoryAnalyticsReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxPatientReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxTransactionReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf.TransactionHierarchicalReportDataset;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final ReportAggregationService reportAggregationService;
    private final TransactionPdfAggregationService transactionPdfAggregationService;
    private final PdfReportGenerator pdfReportGenerator;
    private final PdfBoxInventoryAnalyticsReportGenerator pdfBoxInventoryAnalyticsReportGenerator;
    private final PdfBoxTransactionReportGenerator pdfBoxTransactionReportGenerator;
    private final PdfBoxPatientReportGenerator pdfBoxPatientReportGenerator;

    public byte[] exportReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        if (reportType == ReportType.TRANSACTIONS) {
            if (minDate == null || maxDate == null) {
                throw new BadRequestException(
                        "Both minDate and maxDate are required for transaction reports.");
            }
            TransactionHierarchicalReportDataset dataset =
                    transactionPdfAggregationService.buildTransactionReport(minDate, maxDate);
            return pdfBoxTransactionReportGenerator.generate(dataset);
        }

        if (reportType == ReportType.INVENTORY_ANALYTICS) {
            ComprehensiveInventoryReportDataset dataset = reportAggregationService.buildInventoryAnalyticsReport();
            return pdfBoxInventoryAnalyticsReportGenerator.generate(dataset);
        }

        if (reportType == ReportType.PATIENTS) {
            PatientReportDataset dataset = reportAggregationService.buildPatientReport(reportType, minDate, maxDate);
            return pdfBoxPatientReportGenerator.generate(dataset);
        }

        TabularReportDataset dataset = reportAggregationService.buildReport(reportType, minDate, maxDate);
        return pdfReportGenerator.generate(dataset);
    }
}
