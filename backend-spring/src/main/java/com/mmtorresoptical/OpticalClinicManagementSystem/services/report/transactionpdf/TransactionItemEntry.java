package com.mmtorresoptical.OpticalClinicManagementSystem.services.report.transactionpdf;

import com.mmtorresoptical.OpticalClinicManagementSystem.enums.DiscountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionItemEntry {
    private String productName;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private DiscountType discountType;
    private BigDecimal discountValue;
    private Integer refundedQuantity;
    private String refundReason;
    private BigDecimal refundAmount;
}
