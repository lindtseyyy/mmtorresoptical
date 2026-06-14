package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import lombok.Data;

@Data
public class RefundBatchAllocationDTO {

    private Long productBatchId;
    private Integer quantityToRestore;
    private String refundReason;

}
