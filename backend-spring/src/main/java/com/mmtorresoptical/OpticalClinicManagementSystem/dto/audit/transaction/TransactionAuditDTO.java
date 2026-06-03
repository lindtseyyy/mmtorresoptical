package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem.TransactionItemAuditDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TransactionAuditDTO {

    private UUID transactionId;
    private String transactionNumber;
    private LocalDateTime transactionDate;
    private BigDecimal totalAmount;
    private String paymentMethod;
    private String paymentReferenceNumber;
    private String transactionStatus;
    private String refundStatus;

    private UUID voidedByUserId;
    private LocalDateTime voidedAt;
    private String voidReason;

    private UUID patientId;
    private UUID createdByUserId;

    private BigDecimal amountPaid;
    private BigDecimal paymentAmount;
    private BigDecimal totalRefundedCash;
    private BigDecimal balanceDue;
    private LocalDateTime completedAt;
    private LocalDate estimatedReadyDate;

    private String seniorPwdName;
    private String seniorPwdAddress;
    private String seniorPwdIdNumber;
    private Boolean isSeniorPwdApplied;

    private List<TransactionItemAuditDTO> transactionItemAuditDTOList;
}