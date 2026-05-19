package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ItemRefundResponseDTO {

    private BigDecimal originalTotal;
    private BigDecimal newOrderTotal;
    private BigDecimal amountPaid;
    private BigDecimal cashToReturn;
    private BigDecimal newRemainingDue;
    private String newTransactionStatus;
    private String newRefundStatus;

    private RefundReceiptData refundReceipt;
    private List<RefundedItemSummary> refundedItems;

    @Data
    @Builder
    public static class RefundReceiptData {
        private UUID refundReceiptId;
        private String receiptNumber;
        private BigDecimal cashReturnedAmount;
        private LocalDateTime dateIssued;
        private String issuedByFullName;
    }

    @Data
    @Builder
    public static class RefundedItemSummary {
        private String productName;
        private BigDecimal unitPrice;
        private Integer refundQuantity;
    }
}
