package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusSection {
    private List<TransactionEntry> transactions;
}
