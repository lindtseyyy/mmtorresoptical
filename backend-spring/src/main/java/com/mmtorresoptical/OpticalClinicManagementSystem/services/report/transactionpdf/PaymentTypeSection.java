package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentTypeSection {
    private PaymentType paymentType;
    private TransactionReportSummary summary;
    private StatusSection completed;
    private StatusSection voided;
    private StatusSection refunded;
}
