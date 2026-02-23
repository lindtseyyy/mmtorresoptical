package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TransactionResponseDTO {

    private UUID transactionId;
    private LocalDateTime transactionDate;
    private BigDecimal totalAmount;
    private String paymentType;
    private String referenceNumber;
    private String gcashPaymentImgDir;
    private BigDecimal cashTender;
    private BigDecimal change;
    private String transactionStatus;

    private UserSummaryDTO createdBy;
    private PatientSummaryDTO patient;

    private List<TransactionItemResponseDTO> transactionItems;
}
