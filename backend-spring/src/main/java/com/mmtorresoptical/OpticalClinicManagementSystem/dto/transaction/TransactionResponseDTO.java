package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.patient.PatientSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment.PaymentResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemResponseDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.user.UserSummaryDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TransactionResponseDTO {

    private UUID transactionId;
    private String transactionNumber;
    private LocalDateTime transactionDate;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private BigDecimal change;
    private LocalDateTime completedAt;
    private String transactionStatus;
    private String refundStatus;
    private String fulfillmentStatus;
    private LocalDate estimatedReadyDate;

    private UUID prescriptionId;
    private String rxNumber;

    private UserSummaryDTO createdBy;
    private PatientSummaryDTO patient;

    private List<TransactionItemResponseDTO> transactionItems;
    private List<PaymentResponseDTO> payments;
}
