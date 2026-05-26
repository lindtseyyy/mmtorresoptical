package com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class RefundReceiptDTO {

    private UUID refundReceiptId;
    private String receiptNumber;
    private BigDecimal actualCashback;
    private String refundMethod;
    private String gcashNumber;
    private String referenceNumber;
    private LocalDateTime createdAt;
    private String issuedByFullName;
    private List<RefundItemDataDTO> refundItems;

    @Data
    public static class RefundItemDataDTO {
        private UUID refundItemId;
        private String productName;
        private BigDecimal unitPrice;
        private Integer quantityRefunded;
        private String refundReason;
        private BigDecimal itemCreditAmount;
    }
}
