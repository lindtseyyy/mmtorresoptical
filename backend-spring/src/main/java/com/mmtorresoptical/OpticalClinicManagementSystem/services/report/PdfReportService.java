package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfBoxInventoryAnalyticsReportGenerator;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.pdf.PdfReportGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PdfReportService {

    private final ReportAggregationService reportAggregationService;
    private final PdfReportGenerator pdfReportGenerator;
    private final PdfBoxInventoryAnalyticsReportGenerator pdfBoxInventoryAnalyticsReportGenerator;

    public byte[] exportReport(ReportType reportType) {
        if (reportType == ReportType.INVENTORY_ANALYTICS) {
            ComprehensiveInventoryReportDataset dataset = reportAggregationService.buildInventoryAnalyticsReport();
            return pdfBoxInventoryAnalyticsReportGenerator.generate(dataset);
        }

        TabularReportDataset dataset = reportAggregationService.buildReport(reportType);
        return pdfReportGenerator.generate(dataset);
    }
}
