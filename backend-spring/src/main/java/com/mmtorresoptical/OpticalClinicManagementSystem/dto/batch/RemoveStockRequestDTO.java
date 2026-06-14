package com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RemoveStockRequestDTO {

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private Long productBatchId;

    @NotBlank(message = "Reason is required")
    private String reason;
}
