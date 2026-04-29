package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
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

    public byte[] exportReport(ReportType reportType, LocalDate minDate, LocalDate maxDate) {
        return switch (reportType) {
            case TRANSACTIONS -> {
                if (minDate == null || maxDate == null) {
                    throw new BadRequestException(
                            "Both minDate and maxDate are required for transaction reports.");
                }
                TransactionHierarchicalReportDataset dataset =
                        transactionPdfAggregationService.buildTransactionReport(minDate, maxDate);
                yield pdfBoxTransactionReportGenerator.generate(dataset);
            }
            case INVENTORY_ANALYTICS -> {
                ComprehensiveInventoryReportDataset dataset =
                        reportAggregationService.buildInventoryAnalyticsReport();
                yield pdfBoxInventoryAnalyticsReportGenerator.generate(dataset);
            }
            case PATIENTS -> {
                PatientReportDataset dataset =
                        reportAggregationService.buildPatientReport(reportType, minDate, maxDate);
                yield pdfBoxPatientReportGenerator.generate(dataset);
            }
        };
    }
}
