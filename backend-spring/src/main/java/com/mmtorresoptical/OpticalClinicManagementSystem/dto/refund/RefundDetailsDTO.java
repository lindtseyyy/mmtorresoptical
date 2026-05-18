package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RefundDetailsDTO {

    private UUID refundId;
    private Integer refundQuantity;
    private String refundReason;
    private LocalDateTime refundedAt;
    private BigDecimal itemCreditAmount;
    private BigDecimal actualCashBack;
    private String refundMethod;

    private UserSummaryDTO refundedBy;
}
