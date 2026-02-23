package com.mmtorresoptical.OpticalClinicManagementSystem.dto.transactionitem;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.product.ProductSummaryDTO;
import com.mmtorresoptical.OpticalClinicManagementSystem.dto.refund.RefundDetailsDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class TransactionItemDetailsDTO {

    private UUID transactionItemId;

    private ProductSummaryDTO product;

    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
    private Boolean isRefunded;
    private Boolean isDiscounted;
    private String discountType;
    private BigDecimal discountValue;
    private Integer refundedQuantity;
    private String refundReason;

    private List<RefundDetailsDTO> refundDetailsDTOList;
}