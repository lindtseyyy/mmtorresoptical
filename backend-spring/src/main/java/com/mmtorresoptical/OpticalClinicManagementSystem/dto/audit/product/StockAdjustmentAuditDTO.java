package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentAuditDTO {
    private UUID productId;
    private String productName;
    private String adjustmentType;
    private Integer amount;
    private String reason;
    private Integer quantityBefore;
    private Integer quantityAfter;
}
