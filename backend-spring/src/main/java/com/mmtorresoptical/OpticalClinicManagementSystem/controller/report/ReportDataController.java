package com.mmtorresoptical.OpticalClinicManagementSystem.controller.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ComprehensiveInventoryReportDataset;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.PatientReportDataset;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportAggregationService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.TransactionPdfAggregationService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf.TransactionHierarchicalReportDataset;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
public class ReportDataController {

    private final TransactionPdfAggregationService transactionPdfAggregationService;
    private final ReportAggregationService reportAggregationService;

    @GetMapping("/data/{reportType}")
    public ResponseEntity<?> getReportData(
            @PathVariable ReportType reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate minDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maxDate
    ) {
        return switch (reportType) {
            case TRANSACTIONS -> {
                if (minDate == null || maxDate == null) {
                    throw new BadRequestException(
                            "Both minDate and maxDate are required for transaction report data.");
                }
                TransactionHierarchicalReportDataset dataset =
                        transactionPdfAggregationService.buildTransactionReport(minDate, maxDate);
                yield ResponseEntity.ok(dataset);
            }
            case PATIENTS -> {
                PatientReportDataset dataset =
                        reportAggregationService.buildPatientReport(reportType, minDate, maxDate);
                yield ResponseEntity.ok(dataset);
            }
            case INVENTORY_ANALYTICS -> {
                ComprehensiveInventoryReportDataset dataset =
                        reportAggregationService.buildInventoryAnalyticsReport();
                yield ResponseEntity.ok(dataset);
            }
            default -> throw new BadRequestException(
                    "Report data endpoint currently supports TRANSACTIONS, PATIENTS, and INVENTORY_ANALYTICS report types.");
        };
    }
}
