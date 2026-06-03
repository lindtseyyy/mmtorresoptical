package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class TransactionItemAuditDTO {

    private UUID transactionItemId;

    private UUID productId;
    private String productName;

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;

    private Integer refundedQuantity;
    private String refundReason;

    private Boolean isDiscounted;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal seniorPwdDiscountAmount;
}