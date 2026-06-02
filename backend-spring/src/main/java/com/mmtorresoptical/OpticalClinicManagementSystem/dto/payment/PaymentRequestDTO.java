package com.mmtorresoptical.OpticalClinicManagementSystem.dto.payment;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequestDTO {

    @NotNull
    @Positive
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;

    private String gcashNumber;

    private String referenceNumber;

    private String gcashPaymentImg;
}
