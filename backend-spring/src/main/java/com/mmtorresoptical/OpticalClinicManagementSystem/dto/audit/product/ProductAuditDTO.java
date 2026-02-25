package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.product;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ProductAuditDTO {
    private UUID productId;
    private String productName;
    private String imageDir;
    private String category;
    private String supplier;
    private BigDecimal unitPrice;
    private Integer quantity;
    private Integer lowLevelThreshold;
    private Integer overstockedThreshold;
    private Boolean isArchived;
    private LocalDateTime createdAt;
}