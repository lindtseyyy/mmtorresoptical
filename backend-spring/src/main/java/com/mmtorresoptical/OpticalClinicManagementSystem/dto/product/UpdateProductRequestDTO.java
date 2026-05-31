package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.validation.ProductRequest;
import com.mmtorresoptical.OpticalClinicManagementSystem.validation.ValidProductRequest;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@ValidProductRequest
public class UpdateProductRequestDTO implements ProductRequest {
    @NotEmpty(message = "Product name is required")
    private String productName;

    private String imageDir; // Optional

    private UUID categoryId;

    private String newCategoryName;

    private UUID supplierId;

    private String newSupplierName;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal unitPrice;

    private Integer lowLevelThreshold;

    private Integer overstockedThreshold;

    private Integer leadTimeDays;

    private ProductType productType;
}
