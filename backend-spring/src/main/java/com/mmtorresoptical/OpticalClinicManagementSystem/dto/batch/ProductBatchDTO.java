package com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductBatchDTO {
    private Long productBatchId;
    private String batchNumber;
    private Integer quantityReceived;
    private Integer quantityRemaining;
    private Integer quantityDamaged;
    private LocalDate expiryDate;
    private LocalDate receivedDate;
    private String status;
}
