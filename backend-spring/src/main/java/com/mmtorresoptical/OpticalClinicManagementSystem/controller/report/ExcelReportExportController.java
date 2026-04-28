package com.mmtorresoptical.OpticalClinicManagementSystem.controller.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportAggregationService;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.TabularReportDataset;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.generator.excel.ExcelReportGenerator;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports/excel")
public class ExcelReportExportController {

    private static final Logger logger = LoggerFactory.getLogger(ExcelReportExportController.class);

    private final ReportAggregationService reportAggregationService;
    private final ExcelReportGenerator excelReportGenerator;

    @GetMapping("/{reportType}")
    public ResponseEntity<byte[]> exportExcel(
            @PathVariable ReportType reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate minDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate maxDate
    ) {
        if (!reportType.supportsExcel()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Excel export not supported for " + reportType.name() + " reports.");
        }

        TabularReportDataset dataset = reportAggregationService.buildReport(reportType, minDate, maxDate);

        logger.info("Exporting Excel report: reportType={}, columns={}, rows={}",
                reportType,
                dataset.getColumns() == null ? 0 : dataset.getColumns().size(),
                dataset.getRows() == null ? 0 : dataset.getRows().size());

        byte[] reportBytes = excelReportGenerator.generate(dataset);
        String filename = reportType.name().toLowerCase() + "_" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(reportBytes);
    }
}
