package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.refund;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class RefundAuditDTO {
    private UUID refundId;
    private Integer refundQuantity;
    private String refundReason;
    private LocalDateTime refundedAt;
    private BigDecimal refundAmount;

    private UUID refundedByUserId;
}