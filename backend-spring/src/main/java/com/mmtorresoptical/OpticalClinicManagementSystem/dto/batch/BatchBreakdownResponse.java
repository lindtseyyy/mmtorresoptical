package com.mmtorresoptical.OpticalClinicManagementSystem.dto.batch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchBreakdownResponse {
    private List<ProductBatchDTO> batches;
    private int availableQuantity;
}
