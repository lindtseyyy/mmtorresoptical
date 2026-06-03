package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProductDetailsDTO {

    private UUID productId;
    private String productName;
    private String imageDir;
    private UUID categoryId;
    private String categoryName;
    private UUID supplierId;
    private String supplierName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private String productType;
    private Integer lowLevelThreshold;
    private Integer overstockedThreshold;
    private Integer leadTimeDays;
    private Integer reorderPoint;
    private Integer suggestedOrderQuantity;
    private Boolean isArchived;
    private Boolean isSeniorPwdEligible;
    private LocalDateTime createdAt;
}