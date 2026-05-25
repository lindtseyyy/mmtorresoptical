package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionEntry {
    private UUID id;
    private String transactionNumber;
    private LocalDateTime date;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private TransactionStatus status;
    private RefundStatus refundStatus;
    private String customerName;
    private String cashierName;
    private String voidReason;
    private LocalDateTime voidedAt;
    private String voidedBy;
    private List<TransactionItemEntry> items;
    private List<PaymentMethodEntry> payments;
}
