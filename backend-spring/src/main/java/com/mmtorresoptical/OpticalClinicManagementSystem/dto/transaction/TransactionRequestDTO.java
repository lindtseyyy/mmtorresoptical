package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transaction;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem.TransactionItemsRequestDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import com.mmtorresoptical.OpticalClinicManagementSystem.validation.ValidTransactionPayment;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@ValidTransactionPayment
public class TransactionRequestDTO {

    private UUID patientId;

    @Enumerated(EnumType.STRING)
    @NotNull(message = "Payment type is required")
    private PaymentType paymentType;

    // OPTIONAL — for cash payments
    @Column(name = "cash_tender", precision = 10, scale = 2)
    private BigDecimal cashTender;

    // OPTIONAL — for GCash
    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    // OPTIONAL — for GCash / online payments
    @Column(name = "gcash_payment_img", length = 255)
    private String gcashPaymentImg;

    List<TransactionItemsRequestDTO> items;
}
