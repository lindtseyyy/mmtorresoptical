package com.mmtorresoptical.OpticalClinicManagementSystem.dto.metrics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgingReceivableDTO {

    private String transactionId;
    private String transactionNumber;
    private LocalDate transactionDate;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal balanceDue;
    private long daysOutstanding;

}
