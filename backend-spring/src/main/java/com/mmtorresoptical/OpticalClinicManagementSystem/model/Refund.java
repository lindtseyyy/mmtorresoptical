package com.mmtorresoptical.OpticalClinicManagementSystem.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "refunds")
public class Refund {

    @Id
    @GeneratedValue
    private UUID refundId;

    private Integer refundQuantity;

    private String refundReason;

    private LocalDateTime refundedAt;

    @Column(name = "item_credit_amount", precision = 10, scale = 2)
    private BigDecimal itemCreditAmount;

    @Column(name = "actual_cash_back", precision = 10, scale = 2)
    private BigDecimal actualCashBack = BigDecimal.ZERO;

    @Column(name = "refund_method", length = 20)
    private String refundMethod;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "transaction_item_id", nullable = false)
    private TransactionItem transactionItem;
}
