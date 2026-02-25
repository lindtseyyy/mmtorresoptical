package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem.TransactionItemAuditDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TransactionAuditDTO {

    private UUID transactionId;
    private LocalDateTime transactionDate;
    private BigDecimal totalAmount;
    private String paymentType;
    private String referenceNumber;
    private String paymentProofUrl;
    private BigDecimal cashTender;
    private BigDecimal change;
    private String transactionStatus;

    private UUID voidedByUserId;
    private LocalDateTime voidedAt;
    private String voidReason;

    private UUID patientId;
    private UUID createdByUserId;

    private List<TransactionItemAuditDTO> transactionItemAuditDTOList;
}