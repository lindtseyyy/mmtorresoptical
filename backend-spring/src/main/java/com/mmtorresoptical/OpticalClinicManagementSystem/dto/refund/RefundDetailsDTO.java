package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.User;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
    private BigDecimal refundAmount;

    private UserSummaryDTO refundedBy;
}