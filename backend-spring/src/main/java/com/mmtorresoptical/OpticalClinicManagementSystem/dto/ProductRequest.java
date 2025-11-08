package com.mmtorresoptical.OpticalClinicManagementSystem.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotEmpty(message = "Product name is required")
    private String productName;

    private String imageDir; // Optional

    @NotEmpty(message = "Category is required")
    private String category;

    @NotEmpty(message = "Supplier is required")
    private String supplier;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal unitPrice;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;

    @NotNull(message = "Low stock threshold is required")
    @Min(value = 0, message = "Threshold cannot be negative")
    private Integer lowLevelThreshold;

    @NotNull(message = "Overstocked threshold is required")
    @Min(value = 1, message = "Threshold must be at least 1")
    private Integer overstockedThreshold;

    private Boolean isArchived = false;
}