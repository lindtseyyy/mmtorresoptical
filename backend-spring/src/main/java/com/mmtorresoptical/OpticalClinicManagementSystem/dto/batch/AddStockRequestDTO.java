package com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AddStockRequestDTO {

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    @NotBlank(message = "Batch number is required")
    private String batchNumber;

    private LocalDate expiryDate;

    private String reason;
}
