package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "refund_items")
public class RefundItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "refund_item_id", updatable = false, nullable = false)
    private UUID refundItemId;

    @Column(name = "quantity_refunded", nullable = false)
    private Integer quantityRefunded;

    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;

    @Column(name = "item_credit_amount", precision = 10, scale = 2)
    private BigDecimal itemCreditAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_receipt_id", nullable = false)
    private RefundReceipt refundReceipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_item_id", nullable = false)
    private TransactionItem transactionItem;
}
