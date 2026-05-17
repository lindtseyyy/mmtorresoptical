package com.mmtorresoptical.OpticalClinicManagementSystem.services.report;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.RefundStatus;
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

    private static final List<String> STATUS_ORDER = List.of(
        "PENDING", "DEPOSIT", "PAID", "COMPLETED", "VOIDED"
    );

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

        transactions = new ArrayList<>(transactions.stream()
                .collect(Collectors.toMap(
                        Transaction::getTransactionId,
                        t -> t,
                        (existing, duplicate) -> existing,
                        LinkedHashMap::new
                ))
                .values());

        if (transactions.isEmpty()) {
            return TransactionHierarchicalReportDataset.builder()
                    .metadata(metadata)
                    .minDate(minDate)
                    .maxDate(maxDate)
                    .summary(emptySummary())
                    .statusGroups(Collections.emptyMap())
                    .emptyMessage("No transactions available.")
                    .build();
        }

        List<TransactionEntry> entries = transactions.stream()
                .map(this::mapTransactionToEntry)
                .toList();

        TransactionReportSummary overallSummary = computeSummary(entries);

        Map<String, List<TransactionEntry>> statusGroups = new LinkedHashMap<>();
        for (String statusKey : STATUS_ORDER) {
            List<TransactionEntry> group = entries.stream()
                .filter(e -> e.getStatus() != null && e.getStatus().name().equals(statusKey))
                .collect(Collectors.toList());
            if (!group.isEmpty()) {
                statusGroups.put(statusKey, group);
            }
        }

        // Handle any statuses not in the predefined order
        entries.stream()
            .filter(e -> e.getStatus() != null && !STATUS_ORDER.contains(e.getStatus().name()))
            .forEach(e -> statusGroups.computeIfAbsent(e.getStatus().name(), k -> new ArrayList<>()).add(e));

        return TransactionHierarchicalReportDataset.builder()
                .metadata(metadata)
                .minDate(minDate)
                .maxDate(maxDate)
                .summary(overallSummary)
                .statusGroups(statusGroups)
                .build();
    }

    private TransactionEntry mapTransactionToEntry(Transaction transaction) {
        String customerName = resolveCustomerName(transaction.getPatient());
        String cashierName = resolveCashierName(transaction.getUser());

        String voidedByName = null;
        if (transaction.getVoidedBy() != null) {
            voidedByName = resolveCashierName(transaction.getVoidedBy());
        }

        List<TransactionItemEntry> itemEntries = Collections.emptyList();
        if (transaction.getTransactionItems() != null) {
            itemEntries = transaction.getTransactionItems().stream()
                    .collect(Collectors.toMap(
                            TransactionItem::getTransactionItemId,
                            item -> item,
                            (existing, duplicate) -> existing,
                            LinkedHashMap::new
                    ))
                    .values().stream()
                    .map(this::mapItemToEntry)
                    .toList();
        }

        List<PaymentMethodEntry> paymentEntries = Collections.emptyList();
        if (transaction.getPayments() != null && !transaction.getPayments().isEmpty()) {
            paymentEntries = transaction.getPayments().stream()
                .map(p -> PaymentMethodEntry.builder()
                    .amount(p.getAmount())
                    .paymentMethod(p.getPaymentMethod().name())
                    .referenceNumber(p.getReferenceNumber())
                    .createdAt(p.getCreatedAt())
                    .build())
                .toList();
        }

        return TransactionEntry.builder()
                .id(transaction.getTransactionId())
                .date(transaction.getTransactionDate())
                .totalAmount(transaction.getTotalAmount())
                .amountPaid(transaction.getAmountPaid())
                .balanceDue(transaction.getBalanceDue())
                .status(transaction.getTransactionStatus())
                .refundStatus(transaction.getRefundStatus())
                .customerName(customerName)
                .cashierName(cashierName)
                .voidReason(transaction.getVoidReason())
                .voidedAt(transaction.getVoidedAt())
                .voidedBy(voidedByName)
                .items(itemEntries)
                .payments(paymentEntries)
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

            if (entry.getStatus() == null) continue;
            switch (entry.getStatus()) {
                case PAID, COMPLETED -> {
                    completedCount++;
                    completedAmount = completedAmount.add(amount);
                }
                case VOIDED -> {
                    voidedCount++;
                    voidedAmount = voidedAmount.add(amount);
                }
            }

            if (entry.getRefundStatus() == RefundStatus.ADJUSTED
                    || entry.getRefundStatus() == RefundStatus.RETURNED) {
                refundedCount++;
                refundedAmount = refundedAmount.add(amount);
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
