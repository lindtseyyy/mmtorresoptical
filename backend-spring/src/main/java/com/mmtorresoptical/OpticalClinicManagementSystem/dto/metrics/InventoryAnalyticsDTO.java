package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class InventoryAnalyticsDTO {
    long totalProducts;

    long totalStockQuantity;

    BigDecimal inventoryValue;

    long countLowStockProducts;

    long countOverstockedProducts;

    long countOutOfStockProducts;

    long countArchivedProducts;

    BigDecimal archivedInventoryValue;

    long countArchivedWithStock;
}
