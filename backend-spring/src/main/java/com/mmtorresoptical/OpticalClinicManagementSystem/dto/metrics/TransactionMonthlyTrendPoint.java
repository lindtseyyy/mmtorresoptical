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
public class TransactionMonthlyTrendPoint {
    private String month;
    private long transactionCount;
    private BigDecimal netRevenue;
}
