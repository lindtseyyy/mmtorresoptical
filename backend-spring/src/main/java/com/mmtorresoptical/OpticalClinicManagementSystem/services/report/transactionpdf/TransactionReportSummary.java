package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionReportSummary {
    private long totalCount;
    private BigDecimal totalAmount;
    private long completedCount;
    private BigDecimal completedAmount;
    private long voidedCount;
    private BigDecimal voidedAmount;
    private long refundedCount;
    private BigDecimal refundedAmount;
}
