package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductDetailsDTO;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ComprehensiveInventoryReportDataset {
    private ReportMetadata metadata;
    private BigDecimal totalInventoryValue;
    private long totalLowStockCount;
    private long totalOverstockCount;
    private List<ProductDetailsDTO> lowStockProducts;
    private List<ProductDetailsDTO> overstockProducts;
}
