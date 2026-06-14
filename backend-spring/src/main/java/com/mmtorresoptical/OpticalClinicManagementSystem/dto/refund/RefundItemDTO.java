package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;


import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class RefundItemDTO {

    private UUID transactionItemId;

    private Integer refundQuantity;

    private String refundReason; // optional but recommended

    private List<RefundBatchAllocationDTO> batchAllocations; // optional: explicit batch targets for stock restoration
}