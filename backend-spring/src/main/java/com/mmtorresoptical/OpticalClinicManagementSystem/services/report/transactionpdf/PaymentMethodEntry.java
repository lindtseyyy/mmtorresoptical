package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentMethodEntry {
    private BigDecimal amount;
    private String paymentMethod;
    private String gcashNumber;
    private String referenceNumber;
    private LocalDateTime createdAt;
}
