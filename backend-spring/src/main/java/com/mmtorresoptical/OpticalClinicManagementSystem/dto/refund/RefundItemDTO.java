package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;


import lombok.Data;

import java.util.UUID;

@Data
public class RefundItemDTO {

    private UUID transactionItemId;

    private Integer refundQuantity;

    private String refundReason; // optional but recommended
}