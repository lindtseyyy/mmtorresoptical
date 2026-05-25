package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.ProductType;
import com.mmtorresoptical.OpticalClinicManagementSystem.validation.ProductRequest;
import com.mmtorresoptical.OpticalClinicManagementSystem.validation.ValidProductRequest;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@ValidProductRequest
public class CreateProductRequestDTO implements ProductRequest {
    @NotEmpty(message = "Product name is required")
    private String productName;

    private String imageDir; // Optional

    @NotEmpty(message = "Category is required")
    private String category;

    private String supplier;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal unitPrice;

    private Integer quantity;

    private Integer lowLevelThreshold;

    private Integer overstockedThreshold;

    private Integer leadTimeDays = 3;

    private ProductType productType;

    private Boolean isArchived = false;
}
