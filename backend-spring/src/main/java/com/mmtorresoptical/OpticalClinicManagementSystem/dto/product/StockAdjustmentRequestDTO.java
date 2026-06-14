package com.mmtorresoptical.OpticalClinicManagementSystem.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class StockAdjustmentRequestDTO {

    @NotBlank(message = "Adjustment type is required")
    private String adjustmentType;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be at least 1")
    private Integer amount;

    @NotBlank(message = "Reason is required")
    private String reason;

    private Long productBatchId;

    private LocalDate expiryDate;

    private String batchNumber;
}
