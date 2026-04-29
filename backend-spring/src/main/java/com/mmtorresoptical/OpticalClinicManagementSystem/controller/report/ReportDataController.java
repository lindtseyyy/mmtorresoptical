package com.mmtorresoptical.OpticalClinicManagementSystem.controller.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.exception.custom.BadRequestException;
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

    @GetMapping("/data/{reportType}")
    public ResponseEntity<?> getReportData(
            @PathVariable ReportType reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate minDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maxDate
    ) {
        if (reportType != ReportType.TRANSACTIONS) {
            throw new BadRequestException(
                    "Report data endpoint currently only supports TRANSACTIONS report type.");
        }

        if (minDate == null || maxDate == null) {
            throw new BadRequestException(
                    "Both minDate and maxDate are required for transaction report data.");
        }

        TransactionHierarchicalReportDataset dataset =
                transactionPdfAggregationService.buildTransactionReport(minDate, maxDate);

        return ResponseEntity.ok(dataset);
    }
}
