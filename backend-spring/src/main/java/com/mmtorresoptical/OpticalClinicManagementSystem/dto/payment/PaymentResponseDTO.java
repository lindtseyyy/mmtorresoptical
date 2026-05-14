package com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class PaymentResponseDTO {

    private UUID id;
    private BigDecimal amount;
    private String paymentMethod;
    private String referenceNumber;
    private LocalDateTime createdAt;
}
