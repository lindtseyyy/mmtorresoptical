package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductMetricsDTO {
    private Long totalUnitsSold;
    private BigDecimal totalRevenue;
    private Long numberOfTransactions;
    private LocalDateTime lastSoldDate;
}
