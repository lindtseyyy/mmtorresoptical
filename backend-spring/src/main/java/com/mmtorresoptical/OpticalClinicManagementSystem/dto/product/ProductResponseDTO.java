package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductResponseDTO {

    private UUID productId;
    private String productName;
    private String imageDir; // Optional
    private String category;
    private String supplier;
    private BigDecimal unitPrice;
    private Integer quantity;
    private Integer lowLevelThreshold;
    private Integer overstockedThreshold;
    private Boolean isArchived = false;
}