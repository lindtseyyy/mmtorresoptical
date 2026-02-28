package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class InventoryAnalyticsDTO {
    BigDecimal inventoryValue;

    long countLowStockProducts;

    long countOverstockedProducts;
}
