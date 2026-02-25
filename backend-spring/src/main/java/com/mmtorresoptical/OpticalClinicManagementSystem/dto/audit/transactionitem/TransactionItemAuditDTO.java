package com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.transactionitem;

import com.mmtorresoptical.OpticalClinicManagementSystem.dto.audit.refund.RefundAuditDTO;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
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

    private List<RefundAuditDTO> refundAuditDTOList;
}