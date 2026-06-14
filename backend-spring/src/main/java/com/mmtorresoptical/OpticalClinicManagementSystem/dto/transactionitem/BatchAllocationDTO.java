package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem;

import lombok.Data;

@Data
public class BatchAllocationDTO {

    private Long productBatchId;
    private String batchNumber;
    private Integer quantityDeducted;

}
