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
    private String category;
    private String supplier;
    private BigDecimal unitPrice;
    private Integer quantity;
    private String productType;
    private Integer lowLevelThreshold;
    private Integer overstockedThreshold;
    private Integer leadTimeDays;
    private Integer reorderPoint;
    private Boolean isArchived;
    private LocalDateTime createdAt;
}