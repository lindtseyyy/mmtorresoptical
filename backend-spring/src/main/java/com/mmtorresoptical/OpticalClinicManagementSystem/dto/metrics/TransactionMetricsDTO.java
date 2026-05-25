package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionMetricsDTO {

    private long totalTransactions;
    private BigDecimal totalRevenue;
    private BigDecimal todayRevenue;
    private long todayTransactions;
    private BigDecimal averageTransactionValue;
    private long totalTransactionsThisMonth;
    private BigDecimal monthlyNetRevenue;
    private BigDecimal totalRefundedAmount;
    private BigDecimal todayTotalRefundedAmount;
    private BigDecimal totalRefundedAmountThisMonth;
    private BigDecimal todayTotalVoidedAmount;
    private BigDecimal totalAccountsReceivable;
    private long awaitingPickupCount;
    private long depositsPendingCount;

}
