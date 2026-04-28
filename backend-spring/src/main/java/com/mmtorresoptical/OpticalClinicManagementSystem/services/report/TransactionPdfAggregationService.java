package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.PaymentType;
import com.mmtorresoptical.OpticalClinicManagementSystem.enums.TransactionStatus;
import com.mmtorresoptical.OpticalClinicManagementSystem.model.*;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.controller.TransactionService;
import com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionPdfAggregationService {

    private final TransactionService transactionService;

    public TransactionHierarchicalReportDataset buildTransactionReport(
            LocalDate minDate, LocalDate maxDate
    ) {
        ReportMetadata metadata = ReportMetadata.builder()
                .generatedAt(Instant.now())
                .generatedBy(resolveGeneratedBy())
                .reportType(com.mmtorresoptical.OpticalClinicManagementSystem.enums.ReportType.TRANSACTIONS)
                .title("Transaction Report")
                .build();

        List<Transaction> transactions = transactionService.getTransactionsForReport(minDate, maxDate);

        if (transactions.isEmpty()) {
            return TransactionHierarchicalReportDataset.builder()
                    .metadata(metadata)
                    .minDate(minDate)
                    .maxDate(maxDate)
                    .summary(emptySummary())
                    .paymentTypeSections(Collections.emptyList())
                    .emptyMessage("No transactions available.")
                    .build();
        }

        List<TransactionEntry> entries = transactions.stream()
                .map(this::mapTransactionToEntry)
                .toList();

        TransactionReportSummary overallSummary = computeSummary(entries);

        Map<PaymentType, List<TransactionEntry>> byPaymentType = entries.stream()
                .collect(Collectors.groupingBy(
                        TransactionEntry::getPaymentType,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<PaymentTypeSection> sections = new ArrayList<>();
        for (PaymentType pt : PaymentType.values()) {
            List<TransactionEntry> group = byPaymentType.getOrDefault(pt, Collections.emptyList());
            if (group.isEmpty()) {
                continue;
            }
            sections.add(buildPaymentTypeSection(pt, group));
        }

        return TransactionHierarchicalReportDataset.builder()
                .metadata(metadata)
                .minDate(minDate)
                .maxDate(maxDate)
                .summary(overallSummary)
                .paymentTypeSections(sections)
                .build();
    }

    private TransactionEntry mapTransactionToEntry(Transaction transaction) {
        String customerName = resolveCustomerName(transaction.getPatient());
        String cashierName = resolveCashierName(transaction.getUser());

        BigDecimal change = null;
        if (transaction.getPaymentType() == PaymentType.CASH
                && transaction.getCashTender() != null
                && transaction.getTotalAmount() != null) {
            change = transaction.getCashTender().subtract(transaction.getTotalAmount());
        }

        String voidedByName = null;
        if (transaction.getVoidedBy() != null) {
            voidedByName = resolveCashierName(transaction.getVoidedBy());
        }

        List<TransactionItemEntry> itemEntries = Collections.emptyList();
        if (transaction.getTransactionItems() != null) {
            itemEntries = transaction.getTransactionItems().stream()
                    .map(this::mapItemToEntry)
                    .toList();
        }

        return TransactionEntry.builder()
                .id(transaction.getTransactionId())
                .date(transaction.getTransactionDate())
                .totalAmount(transaction.getTotalAmount())
                .paymentType(transaction.getPaymentType())
                .status(transaction.getTransactionStatus())
                .customerName(customerName)
                .cashierName(cashierName)
                .cashTender(transaction.getCashTender())
                .change(change)
                .referenceNumber(transaction.getReferenceNumber())
                .gcashPaymentImgDir(transaction.getGcashPaymentImgDir())
                .voidReason(transaction.getVoidReason())
                .voidedAt(transaction.getVoidedAt())
                .voidedBy(voidedByName)
                .items(itemEntries)
                .build();
    }

    private TransactionItemEntry mapItemToEntry(TransactionItem item) {
        BigDecimal refundAmount = BigDecimal.ZERO;
        String refundReason = null;

        if (item.getRefunds() != null && !item.getRefunds().isEmpty()) {
            for (Refund refund : item.getRefunds()) {
                if (refund.getRefundAmount() != null) {
                    refundAmount = refundAmount.add(refund.getRefundAmount());
                }
                if (refundReason == null && refund.getRefundReason() != null) {
                    refundReason = refund.getRefundReason();
                }
            }
        }

        return TransactionItemEntry.builder()
                .productName(item.getProduct() != null ? item.getProduct().getProductName() : "Unknown")
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .discountType(item.getDiscountType())
                .discountValue(item.getDiscountValue())
                .refundedQuantity(item.getRefundedQuantity())
                .refundReason(refundReason)
                .refundAmount(refundAmount.compareTo(BigDecimal.ZERO) > 0 ? refundAmount : null)
                .build();
    }

    private PaymentTypeSection buildPaymentTypeSection(
            PaymentType paymentType, List<TransactionEntry> entries
    ) {
        TransactionReportSummary sectionSummary = computeSummary(entries);

        Map<String, List<TransactionEntry>> byStatus = new LinkedHashMap<>();
        byStatus.put("completed", new ArrayList<>());
        byStatus.put("voided", new ArrayList<>());
        byStatus.put("refunded", new ArrayList<>());

        for (TransactionEntry entry : entries) {
            switch (entry.getStatus()) {
                case COMPLETED -> byStatus.get("completed").add(entry);
                case VOIDED -> byStatus.get("voided").add(entry);
                case PARTIALLY_REFUNDED, FULLY_REFUNDED -> byStatus.get("refunded").add(entry);
            }
        }

        return PaymentTypeSection.builder()
                .paymentType(paymentType)
                .summary(sectionSummary)
                .completed(buildStatusSection(byStatus.get("completed")))
                .voided(buildStatusSection(byStatus.get("voided")))
                .refunded(buildStatusSection(byStatus.get("refunded")))
                .build();
    }

    private StatusSection buildStatusSection(List<TransactionEntry> entries) {
        if (entries == null || entries.isEmpty()) {
            return null;
        }
        return StatusSection.builder()
                .transactions(entries)
                .build();
    }

    private TransactionReportSummary computeSummary(List<TransactionEntry> entries) {
        long totalCount = entries.size();
        BigDecimal totalAmount = BigDecimal.ZERO;
        long completedCount = 0;
        BigDecimal completedAmount = BigDecimal.ZERO;
        long voidedCount = 0;
        BigDecimal voidedAmount = BigDecimal.ZERO;
        long refundedCount = 0;
        BigDecimal refundedAmount = BigDecimal.ZERO;

        for (TransactionEntry entry : entries) {
            BigDecimal amount = entry.getTotalAmount() != null ? entry.getTotalAmount() : BigDecimal.ZERO;
            totalAmount = totalAmount.add(amount);

            switch (entry.getStatus()) {
                case COMPLETED -> {
                    completedCount++;
                    completedAmount = completedAmount.add(amount);
                }
                case VOIDED -> {
                    voidedCount++;
                    voidedAmount = voidedAmount.add(amount);
                }
                case PARTIALLY_REFUNDED, FULLY_REFUNDED -> {
                    refundedCount++;
                    refundedAmount = refundedAmount.add(amount);
                }
            }
        }

        return TransactionReportSummary.builder()
                .totalCount(totalCount)
                .totalAmount(totalAmount)
                .completedCount(completedCount)
                .completedAmount(completedAmount)
                .voidedCount(voidedCount)
                .voidedAmount(voidedAmount)
                .refundedCount(refundedCount)
                .refundedAmount(refundedAmount)
                .build();
    }

    private TransactionReportSummary emptySummary() {
        return TransactionReportSummary.builder()
                .totalCount(0)
                .totalAmount(BigDecimal.ZERO)
                .completedCount(0)
                .completedAmount(BigDecimal.ZERO)
                .voidedCount(0)
                .voidedAmount(BigDecimal.ZERO)
                .refundedCount(0)
                .refundedAmount(BigDecimal.ZERO)
                .build();
    }

    private String resolveCustomerName(Patient patient) {
        if (patient == null) {
            return null;
        }
        String first = patient.getFirstName();
        String last = patient.getLastName();
        if (first == null && last == null) {
            return null;
        }
        return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
    }

    private String resolveCashierName(User user) {
        if (user == null) {
            return null;
        }
        String first = user.getFirstName();
        String last = user.getLastName();
        if (first == null && last == null) {
            return null;
        }
        return ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
    }

    private String resolveGeneratedBy() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "System";
        }

        String username = auth.getName();
        String role = auth.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority())
                .orElse("UNKNOWN");

        if (role.startsWith("ROLE_")) {
            role = role.substring("ROLE_".length());
        }

        if (username == null || username.isBlank()) {
            username = "System";
        }

        return username + " (" + role + ")";
    }
}
