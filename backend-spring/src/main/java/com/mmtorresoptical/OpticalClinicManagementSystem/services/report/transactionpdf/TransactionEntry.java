package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
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
    private LocalDateTime date;
    private BigDecimal totalAmount;
    private PaymentType paymentType;
    private TransactionStatus status;
    private String customerName;
    private String cashierName;
    private BigDecimal cashTender;
    private BigDecimal change;
    private String referenceNumber;
    private String gcashPaymentImgDir;
    private String voidReason;
    private LocalDateTime voidedAt;
    private String voidedBy;
    private List<TransactionItemEntry> items;
}
