package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.ReportMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHierarchicalReportDataset {
    private ReportMetadata metadata;
    private LocalDate minDate;
    private LocalDate maxDate;
    private TransactionReportSummary summary;
    private Map<String, List<TransactionEntry>> statusGroups;
    @Builder.Default
    private String emptyMessage = "No transactions available.";
}
