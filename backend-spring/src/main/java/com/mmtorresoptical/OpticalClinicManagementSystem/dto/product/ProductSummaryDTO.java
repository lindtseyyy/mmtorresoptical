package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import lombok.Data;

import java.util.UUID;

@Data
public class ProductSummaryDTO {

    private UUID productId;
    private String productName;
    private String imageDir;
    private String category;
    private String supplier;
}